use actix_web::{web, App, HttpServer, Result as ActixResult};
use serde::{Deserialize, Serialize};
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    pubkey::Pubkey,
    signature::{Keypair, Signature},
    transaction::Transaction,
    instruction::Instruction,
    system_instruction,
    commitment_config::CommitmentConfig,
};
use tokio::{
    sync::{mpsc, RwLock},
    time::{Duration, Instant},
};
use std::{
    collections::HashMap,
    sync::Arc,
    str::FromStr,
};
use redis::{AsyncCommands, Client as RedisClient};
use reqwest::Client as HttpClient;
use tonic::transport::Channel;
use yellowstone_grpc_client::GeyserGrpcClient;
use yellowstone_grpc_proto::{
    geyser::{SubscribeRequest, SubscribeRequestFilterAccounts, SubscribeRequestFilterTransactions},
    convert_from,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenLaunch {
    pub mint: String,
    pub symbol: String,
    pub name: String,
    pub initial_liquidity: u64,
    pub bonding_curve: String,
    pub creator: String,
    pub timestamp: u64,
    pub market_cap: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArbitrageOpportunity {
    pub token_mint: String,
    pub buy_dex: String,
    pub sell_dex: String,
    pub buy_price: f64,
    pub sell_price: f64,
    pub profit_percentage: f64,
    pub volume_available: u64,
    pub gas_cost_estimate: u64,
    pub net_profit_estimate: f64,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradingStrategy {
    pub id: String,
    pub name: String,
    pub strategy_type: StrategyType,
    pub buy_amount: u64, // in lamports
    pub max_slippage: f64,
    pub take_profit_percentage: f64,
    pub stop_loss_percentage: f64,
    pub max_hold_time: Duration,
    pub min_liquidity: u64,
    pub risk_score_threshold: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum StrategyType {
    PumpSniper,
    Arbitrage,
    GridTrading,
    DCA,
}

#[derive(Debug, Clone)]
pub struct Portfolio {
    pub total_value: f64,
    pub sol_balance: u64,
    pub active_positions: HashMap<String, Position>,
    pub daily_pnl: f64,
    pub total_pnl: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub token_mint: String,
    pub amount: u64,
    pub entry_price: f64,
    pub current_price: f64,
    pub pnl: f64,
    pub entry_time: u64,
    pub strategy_id: String,
}

// Main trading engine
pub struct TradingEngine {
    pub rpc_client: RpcClient,
    pub grpc_client: Arc<RwLock<Option<GeyserGrpcClient<Channel>>>>,
    pub redis_client: RedisClient,
    pub http_client: HttpClient,
    pub wallet: Keypair,
    pub strategies: Arc<RwLock<Vec<TradingStrategy>>>,
    pub portfolio: Arc<RwLock<Portfolio>>,
    pub active_opportunities: Arc<RwLock<Vec<ArbitrageOpportunity>>>,
    pub signal_sender: mpsc::UnboundedSender<TradingSignal>,
}

#[derive(Debug, Clone)]
pub enum TradingSignal {
    NewTokenLaunch(TokenLaunch),
    ArbitrageFound(ArbitrageOpportunity),
    PriceUpdate { mint: String, price: f64 },
    LiquidityChange { mint: String, liquidity: u64 },
    ExecuteTrade { signal_type: String, data: serde_json::Value },
}

impl TradingEngine {
    pub async fn new(
        rpc_url: String,
        grpc_url: String,
        redis_url: String,
        wallet_path: String,
    ) -> Result<Self, Box<dyn std::error::Error>> {
        // Initialize connections
        let rpc_client = RpcClient::new_with_commitment(rpc_url, CommitmentConfig::processed());
        let redis_client = RedisClient::open(redis_url)?;
        let http_client = HttpClient::new();
        
        // Load wallet
        let wallet_bytes = std::fs::read(wallet_path)?;
        let wallet = Keypair::from_bytes(&wallet_bytes)?;
        
        // gRPC client (will be connected later)
        let grpc_client = Arc::new(RwLock::new(None));
        
        // Communication channel
        let (signal_sender, signal_receiver) = mpsc::unbounded_channel();
        
        let engine = Self {
            rpc_client,
            grpc_client,
            redis_client,
            http_client,
            wallet,
            strategies: Arc::new(RwLock::new(Vec::new())),
            portfolio: Arc::new(RwLock::new(Portfolio {
                total_value: 0.0,
                sol_balance: 0,
                active_positions: HashMap::new(),
                daily_pnl: 0.0,
                total_pnl: 0.0,
            })),
            active_opportunities: Arc::new(RwLock::new(Vec::new())),
            signal_sender,
        };
        
        // Start background tasks
        engine.start_grpc_stream().await?;
        engine.start_signal_processor(signal_receiver).await;
        engine.start_arbitrage_scanner().await;
        
        Ok(engine)
    }

    // Real-time gRPC streaming for pump.fun monitoring
    pub async fn start_grpc_stream(&self) -> Result<(), Box<dyn std::error::Error>> {
        let grpc_client_clone = self.grpc_client.clone();
        let signal_sender = self.signal_sender.clone();
        
        tokio::spawn(async move {
            loop {
                match Self::connect_grpc_stream(grpc_client_clone.clone(), signal_sender.clone()).await {
                    Ok(_) => println!("gRPC stream ended, reconnecting..."),
                    Err(e) => println!("gRPC error: {}, reconnecting in 5s...", e),
                }
                tokio::time::sleep(Duration::from_secs(5)).await;
            }
        });
        
        Ok(())
    }

    async fn connect_grpc_stream(
        grpc_client: Arc<RwLock<Option<GeyserGrpcClient<Channel>>>>,
        signal_sender: mpsc::UnboundedSender<TradingSignal>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        // Connect to Yellowstone gRPC
        let endpoint = "http://grpc.solana.com:10000"; // Replace with actual endpoint
        let mut client = GeyserGrpcClient::connect(endpoint.to_string()).await?;
        
        *grpc_client.write().await = Some(client.clone());

        // Subscribe to pump.fun program account changes
        let pump_fun_program = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
        
        let mut accounts = HashMap::new();
        accounts.insert(
            "pump_fun".to_string(),
            SubscribeRequestFilterAccounts {
                account: vec![pump_fun_program.to_string()],
                owner: vec![],
                filters: vec![],
            },
        );

        let subscription = SubscribeRequest {
            slots: HashMap::new(),
            accounts,
            transactions: HashMap::new(),
            blocks: HashMap::new(),
            blocks_meta: HashMap::new(),
            entry: HashMap::new(),
            commitment: Some(1), // Processed commitment
            accounts_data_slice: vec![],
            ping: None,
        };

        let mut stream = client.subscribe(subscription).await?;
        
        while let Some(message) = stream.message().await? {
            if let Some(update) = message.update_oneof {
                match update {
                    // Account changes (new tokens, liquidity changes)
                    yellowstone_grpc_proto::geyser::subscribe_update::UpdateOneof::Account(account_update) => {
                        if let Some(account) = account_update.account {
                            // Parse pump.fun account data
                            if let Ok(token_launch) = Self::parse_pump_fun_account(&account.data) {
                                let _ = signal_sender.send(TradingSignal::NewTokenLaunch(token_launch));
                            }
                        }
                    }
                    // Transaction confirmations
                    yellowstone_grpc_proto::geyser::subscribe_update::UpdateOneof::Transaction(tx_update) => {
                        // Monitor large buys/sells for copy trading signals
                        if let Some(transaction) = tx_update.transaction {
                            // Process transaction for trading signals
                            Self::process_transaction_for_signals(&transaction, &signal_sender).await;
                        }
                    }
                    _ => {}
                }
            }
        }
        
        Ok(())
    }

    // Parse pump.fun account data to detect new token launches
    fn parse_pump_fun_account(data: &[u8]) -> Result<TokenLaunch, Box<dyn std::error::Error>> {
        // This would use the actual pump.fun account structure
        // For now, simplified parsing
        
        // In reality, you'd use the pump.fun IDL to properly decode
        let token_launch = TokenLaunch {
            mint: "token_mint_from_data".to_string(),
            symbol: "PEPE".to_string(),
            name: "Pepe Coin".to_string(),
            initial_liquidity: 1000000000, // 1 SOL in lamports
            bonding_curve: "bonding_curve_address".to_string(),
            creator: "creator_address".to_string(),
            timestamp: chrono::Utc::now().timestamp() as u64,
            market_cap: 50000, // $50k initial market cap
        };
        
        Ok(token_launch)
    }

    async fn process_transaction_for_signals(
        transaction: &yellowstone_grpc_proto::geyser::SubscribeUpdateTransaction,
        signal_sender: &mpsc::UnboundedSender<TradingSignal>,
    ) {
        // Analyze transaction for trading signals
        // - Large buy orders (whale activity)
        // - Pump.fun interactions
        // - DEX arbitrage opportunities
        
        // This would parse transaction instructions and identify opportunities
    }

    // Background task: Process trading signals
    async fn start_signal_processor(&self, mut receiver: mpsc::UnboundedReceiver<TradingSignal>) {
        let engine_clone = self.clone_for_background();
        
        tokio::spawn(async move {
            while let Some(signal) = receiver.recv().await {
                match signal {
                    TradingSignal::NewTokenLaunch(launch) => {
                        engine_clone.handle_new_token_launch(launch).await;
                    }
                    TradingSignal::ArbitrageFound(opportunity) => {
                        engine_clone.handle_arbitrage_opportunity(opportunity).await;
                    }
                    TradingSignal::PriceUpdate { mint, price } => {
                        engine_clone.handle_price_update(mint, price).await;
                    }
                    _ => {}
                }
            }
        });
    }

    // Handle new token launch (pump.fun sniping)
    async fn handle_new_token_launch(&self, launch: TokenLaunch) {
        println!("🚀 New token detected: {} ({})", launch.name, launch.symbol);
        
        // Quick analysis
        let should_buy = self.analyze_token_launch(&launch).await;
        
        if should_buy {
            // Execute ultra-fast buy
            match self.execute_pump_fun_buy(&launch).await {
                Ok(signature) => {
                    println!("✅ Bought {} - Tx: {}", launch.symbol, signature);
                    
                    // Set up exit strategy
                    self.setup_exit_strategy(&launch).await;
                }
                Err(e) => {
                    println!("❌ Failed to buy {}: {}", launch.symbol, e);
                }
            }
        }
    }

    // Analyze if token is worth buying
    async fn analyze_token_launch(&self, launch: &TokenLaunch) -> bool {
        // Quick heuristics for profitable pump.fun trades
        
        // 1. Check minimum liquidity
        if launch.initial_liquidity < 1_000_000_000 { // Less than 1 SOL
            return false;
        }
        
        // 2. Check market cap isn't too high
        if launch.market_cap > 100_000 { // Over $100k
            return false;
        }
        
        // 3. Quick honeypot check (simplified)
        if self.is_potential_honeypot(&launch.mint).await {
            return false;
        }
        
        // 4. Creator analysis (simplified)
        if self.is_suspicious_creator(&launch.creator).await {
            return false;
        }
        
        // 5. AI sentiment analysis (if enabled)
        if let Ok(sentiment) = self.get_ai_sentiment_score(&launch).await {
            if sentiment < 0.6 { // Below 60% confidence
                return false;
            }
        }
        
        true
    }

    // Execute pump.fun buy order
    async fn execute_pump_fun_buy(&self, launch: &TokenLaunch) -> Result<Signature, Box<dyn std::error::Error>> {
        println!("💰 Executing buy for {}", launch.symbol);
        
        // 1. Get Jupiter quote for pump.fun token
        let buy_amount = 100_000_000; // 0.1 SOL in lamports
        let quote = self.get_jupiter_quote(
            "So11111111111111111111111111111111111111112", // SOL mint
            &launch.mint,
            buy_amount,
        ).await?;
        
        // 2. Build swap transaction
        let swap_transaction = self.build_jupiter_swap_transaction(&quote).await?;
        
        // 3. Execute with high priority fee
        let signature = self.send_transaction_with_priority(swap_transaction).await?;
        
        // 4. Update portfolio
        self.update_portfolio_after_buy(launch, buy_amount, quote.out_amount).await;
        
        Ok(signature)
    }

    // Background arbitrage scanner
    async fn start_arbitrage_scanner(&self) {
        let engine_clone = self.clone_for_background();
        
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_millis(500)); // Scan every 500ms
            
            loop {
                interval.tick().await;
                engine_clone.scan_arbitrage_opportunities().await;
            }
        });
    }

    // Scan for arbitrage opportunities across DEXs
    async fn scan_arbitrage_opportunities(&self) {
        // Popular tokens to monitor for arbitrage
        let tokens = vec![
            "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
            "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT  
            "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", // mSOL
            // Add popular meme coins
        ];
        
        for token_mint in tokens {
            if let Ok(opportunity) = self.find_arbitrage_opportunity(token_mint).await {
                if opportunity.profit_percentage > 0.5 { // Minimum 0.5% profit
                    let _ = self.signal_sender.send(TradingSignal::ArbitrageFound(opportunity));
                }
            }
        }
    }

    // Find arbitrage opportunities between DEXs
    async fn find_arbitrage_opportunity(
        &self, 
        token_mint: &str
    ) -> Result<ArbitrageOpportunity, Box<dyn std::error::Error>> {
        // Get prices from multiple DEXs
        let raydium_price = self.get_raydium_price(token_mint).await?;
        let orca_price = self.get_orca_price(token_mint).await?;
        let jupiter_price = self.get_jupiter_price(token_mint).await?;
        
        // Find best buy and sell prices
        let prices = vec![
            ("Raydium", raydium_price),
            ("Orca", orca_price), 
            ("Jupiter", jupiter_price),
        ];
        
        let (buy_dex, buy_price) = prices.iter().min_by(|a, b| a.1.partial_cmp(&b.1).unwrap()).unwrap();
        let (sell_dex, sell_price) = prices.iter().max_by(|a, b| a.1.partial_cmp(&b.1).unwrap()).unwrap();
        
        let profit_percentage = ((sell_price - buy_price) / buy_price) * 100.0;
        
        // Estimate gas costs
        let gas_cost = self.estimate_arbitrage_gas_cost().await?;
        let volume_available = self.get_available_liquidity(token_mint, buy_dex).await?;
        
        let net_profit = (profit_percentage / 100.0) * volume_available as f64 - gas_cost as f64;
        
        Ok(ArbitrageOpportunity {
            token_mint: token_mint.to_string(),
            buy_dex: buy_dex.to_string(),
            sell_dex: sell_dex.to_string(),
            buy_price: *buy_price,
            sell_price: *sell_price,
            profit_percentage,
            volume_available,
            gas_cost_estimate: gas_cost,
            net_profit_estimate: net_profit,
            timestamp: chrono::Utc::now().timestamp() as u64,
        })
    }

    // Handle arbitrage opportunity
    async fn handle_arbitrage_opportunity(&self, opportunity: ArbitrageOpportunity) {
        println!("🔄 Arbitrage opportunity: {} -> {} ({:.2}% profit)", 
                 opportunity.buy_dex, opportunity.sell_dex, opportunity.profit_percentage);
        
        // Check if profitable after fees
        if opportunity.net_profit_estimate > 10.0 { // Minimum $10 profit
            match self.execute_arbitrage(&opportunity).await {
                Ok(signatures) => {
                    println!("✅ Arbitrage executed: Buy: {}, Sell: {}", 
                             signatures.0, signatures.1);
                }
                Err(e) => {
                    println!("❌ Arbitrage failed: {}", e);
                }
            }
        }
    }

    // Execute arbitrage trade
    async fn execute_arbitrage(
        &self, 
        opportunity: &ArbitrageOpportunity
    ) -> Result<(Signature, Signature), Box<dyn std::error::Error>> {
        let trade_amount = std::cmp::min(opportunity.volume_available, 1_000_000_000); // Max 1 SOL
        
        // 1. Buy on cheaper DEX
        let buy_quote = self.get_jupiter_quote(
            "So11111111111111111111111111111111111111112", // SOL
            &opportunity.token_mint,
            trade_amount,
        ).await?;
        
        let buy_tx = self.build_jupiter_swap_transaction(&buy_quote).await?;
        let buy_signature = self.send_transaction_with_priority(buy_tx).await?;
        
        // 2. Wait for confirmation
        self.confirm_transaction(&buy_signature).await?;
        
        // 3. Sell on expensive DEX
        let sell_quote = self.get_jupiter_quote(
            &opportunity.token_mint,
            "So11111111111111111111111111111111111111112", // SOL
            buy_quote.out_amount,
        ).await?;
        
        let sell_tx = self.build_jupiter_swap_transaction(&sell_quote).await?;
        let sell_signature = self.send_transaction_with_priority(sell_tx).await?;
        
        // 4. Update portfolio
        self.update_portfolio_after_arbitrage(opportunity, &buy_quote, &sell_quote).await;
        
        Ok((buy_signature, sell_signature))
    }

    // Jupiter API integration
    async fn get_jupiter_quote(
        &self,
        input_mint: &str,
        output_mint: &str,
        amount: u64,
    ) -> Result<JupiterQuote, Box<dyn std::error::Error>> {
        let url = format!(
            "https://quote-api.jup.ag/v6/quote?inputMint={}&outputMint={}&amount={}&slippageBps=300",
            input_mint, output_mint, amount
        );
        
        let response: JupiterQuote = self.http_client
            .get(&url)
            .send()
            .await?
            .json()
            .await?;
            
        Ok(response)
    }

    // Build transaction from Jupiter quote
    async fn build_jupiter_swap_transaction(
        &self,
        quote: &JupiterQuote,
    ) -> Result<Transaction, Box<dyn std::error::Error>> {
        let swap_request = serde_json::json!({
            "quoteResponse": quote,
            "userPublicKey": self.wallet.pubkey().to_string(),
            "wrapAndUnwrapSol": true,
            "dynamicComputeUnitLimit": true,
            "prioritizationFeeLamports": "auto"
        });

        let response: SwapResponse = self.http_client
            .post("https://quote-api.jup.ag/v6/swap")
            .json(&swap_request)
            .send()
            .await?
            .json()
            .await?;

        // Deserialize transaction
        let transaction = bincode::deserialize(&bs58::decode(&response.swap_transaction).into_vec()?)?;
        
        Ok(transaction)
    }

    // Send transaction with high priority
    async fn send_transaction_with_priority(
        &self,
        mut transaction: Transaction,
    ) -> Result<Signature, Box<dyn std::error::Error>> {
        // Get recent blockhash
        let recent_blockhash = self.rpc_client.get_latest_blockhash().await?;
        transaction.message.recent_blockhash = recent_blockhash;
        
        // Calculate priority fee based on network congestion
        let priority_fee = self.calculate_priority_fee().await?;
        
        // Add priority fee instruction
        let priority_instruction = solana_sdk::compute_budget::ComputeBudgetInstruction::set_compute_unit_price(priority_fee);
        transaction.message.instructions.insert(0, priority_instruction);
        
        // Sign transaction
        transaction.sign(&[&self.wallet], recent_blockhash);
        
        // Send transaction
        let signature = self.rpc_client.send_and_confirm_transaction_with_spinner_and_config(
            &transaction,
            CommitmentConfig::processed(),
            solana_client::rpc_config::RpcSendTransactionConfig {
                skip_preflight: false,
                preflight_commitment: Some(solana_sdk::commitment_config::CommitmentLevel::Processed),
                encoding: Some(solana_client::rpc_config::UiTransactionEncoding::Base64),
                max_retries: Some(5),
                min_context_slot: None,
            },
        ).await?;
        
        Ok(signature)
    }

    // Risk management and exit strategies
    async fn setup_exit_strategy(&self, launch: &TokenLaunch) {
        let token_mint = launch.mint.clone();
        let entry_time = Instant::now();
        let engine_clone = self.clone_for_background();
        
        tokio::spawn(async move {
            let mut check_interval = tokio::time::interval(Duration::from_secs(5));
            
            loop {
                check_interval.tick().await;
                
                // Check exit conditions
                if let Ok(should_exit) = engine_clone.should_exit_position(&token_mint, entry_time).await {
                    if should_exit {
                        match engine_clone.execute_exit(&token_mint).await {
                            Ok(signature) => {
                                println!("🏃 Exited position {} - Tx: {}", token_mint, signature);
                                break;
                            }
                            Err(e) => {
                                println!("❌ Exit failed for {}: {}", token_mint, e);
                            }
                        }
                    }
                }
                
                // Maximum hold time check (e.g., 30 minutes)
                if entry_time.elapsed() > Duration::from_mins(30) {
                    let _ = engine_clone.execute_exit(&token_mint).await;
                    break;
                }
            }
        });
    }

    // Determine if should exit position
    async fn should_exit_position(
        &self,
        token_mint: &str,
        entry_time: Instant,
    ) -> Result<bool, Box<dyn std::error::Error>> {
        // Get current price
        let current_price = self.get_jupiter_price(token_mint).await?;
        
        // Get entry price from portfolio
        let portfolio = self.portfolio.read().await;
        if let Some(position) = portfolio.active_positions.get(token_mint) {
            let price_change = (current_price - position.entry_price) / position.entry_price;
            
            // Exit conditions
            if price_change >= 2.0 {      // 200% profit (3x)
                return Ok(true);
            }
            if price_change <= -0.5 {     // 50% loss
                return Ok(true);
            }
            if entry_time.elapsed() > Duration::from_mins(15) && price_change >= 0.5 { // 15min + 50% profit
                return Ok(true);
            }
        }
        
        Ok(false)
    }

    // AI integration for token analysis
    async fn get_ai_sentiment_score(&self, launch: &TokenLaunch) -> Result<f64, Box<dyn std::error::Error>> {
        let prompt = format!(
            "Analyze this new Solana token for pump potential:
            Name: {}
            Symbol: {}
            Initial Liquidity: {} SOL
            Market Cap: ${}
            
            Rate from 0.0 to 1.0 the likelihood this will pump in the next 30 minutes.
            Consider: name appeal, liquidity size, market conditions.
            Respond with just a number.",
            launch.name,
            launch.symbol,
            launch.initial_liquidity as f64 / 1e9,
            launch.market_cap
        );

        let request = serde_json::json!({
            "model": "gpt-4",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 10,
            "temperature": 0.1
        });

        let response: serde_json::Value = self.http_client
            .post("https://api.openai.com/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", std::env::var("OPENAI_API_KEY")?))
            .json(&request)
            .send()
            .await?
            .json()
            .await?;

        // Parse AI response
        let score_str = response["choices"][0]["message"]["content"]
            .as_str()
            .ok_or("Invalid AI response")?;
            
        let score: f64 = score_str.trim().parse()?;
        
        Ok(score)
    }

    // Portfolio management
    async fn update_portfolio_after_buy(&self, launch: &TokenLaunch, sol_spent: u64, tokens_received: u64) {
        let mut portfolio = self.portfolio.write().await;
        
        // Update SOL balance
        portfolio.sol_balance = portfolio.sol_balance.saturating_sub(sol_spent);
        
        // Add new position
        let position = Position {
            token_mint: launch.mint.clone(),
            amount: tokens_received,
            entry_price: sol_spent as f64 / tokens_received as f64,
            current_price: sol_spent as f64 / tokens_received as f64,
            pnl: 0.0,
            entry_time: chrono::Utc::now().timestamp() as u64,
            strategy_id: "pump_sniper".to_string(),
        };
        
        portfolio.active_positions.insert(launch.mint.clone(), position);
        
        // Cache in Redis for fast access
        let mut redis_con = self.redis_client.get_async_connection().await.unwrap();
        let portfolio_json = serde_json::to_string(&*portfolio).unwrap();
        let _: () = redis_con.set(
            format!("portfolio:{}", self.wallet.pubkey()),
            portfolio_json,
        ).await.unwrap();
    }

    // Helper methods for the clone pattern
    fn clone_for_background(&self) -> Self {
        Self {
            rpc_client: self.rpc_client.clone(),
            grpc_client: self.grpc_client.clone(),
            redis_client: self.redis_client.clone(),
            http_client: self.http_client.clone(),
            wallet: Keypair::from_bytes(&self.wallet.to_bytes()).unwrap(),
            strategies: self.strategies.clone(),
            portfolio: self.portfolio.clone(),
            active_opportunities: self.active_opportunities.clone(),
            signal_sender: self.signal_sender.clone(),
        }
    }

    // DEX price fetching methods
    async fn get_raydium_price(&self, token_mint: &str) -> Result<f64, Box<dyn std::error::Error>> {
        // Raydium API integration
        let url = format!("https://api.raydium.io/v2/ammV3/ammPools");
        let response: serde_json::Value = self.http_client.get(&url).send().await?.json().await?;
        
        // Parse Raydium response to find token price
        // This is simplified - actual implementation would parse pool data
        Ok(1.0)
    }

    async fn get_orca_price(&self, token_mint: &str) -> Result<f64, Box<dyn std::error::Error>> {
        // Orca API integration
        let url = format!("https://api.orca.so/v1/token/{}/price", token_mint);
        let response: serde_json::Value = self.http_client.get(&url).send().await?.json().await?;
        
        Ok(response["price"].as_f64().unwrap_or(0.0))
    }

    async fn get_jupiter_price(&self, token_mint: &str) -> Result<f64, Box<dyn std::error::Error>> {
        let url = format!(
            "https://price.jup.ag/v4/price?ids={}",
            token_mint
        );
        
        let response: serde_json::Value = self.http_client.get(&url).send().await?.json().await?;
        
        Ok(response["data"][token_mint]["price"].as_f64().unwrap_or(0.0))
    }

    async fn get_available_liquidity(&self, token_mint: &str, dex: &str) -> Result<u64, Box<dyn std::error::Error>> {
        // Query specific DEX for available liquidity
        match dex {
            "Raydium" => self.get_raydium_liquidity(token_mint).await,
            "Orca" => self.get_orca_liquidity(token_mint).await,
            _ => Ok(1_000_000_000), // Default 1 SOL
        }
    }

    async fn get_raydium_liquidity(&self, token_mint: &str) -> Result<u64, Box<dyn std::error::Error>> {
        // Query Raydium pool for available liquidity
        Ok(1_000_000_000) // Placeholder
    }

    async fn get_orca_liquidity(&self, token_mint: &str) -> Result<u64, Box<dyn std::error::Error>> {
        // Query Orca pool for available liquidity
        Ok(1_000_000_000) // Placeholder
    }

    async fn estimate_arbitrage_gas_cost(&self) -> Result<u64, Box<dyn std::error::Error>> {
        // Calculate estimated gas cost for arbitrage transaction
        // Two swaps + potential account creation
        Ok(5000) // ~0.000005 SOL in lamports
    }

    async fn calculate_priority_fee(&self) -> Result<u64, Box<dyn std::error::Error>> {
        // Get recent priority fees from network
        let recent_fees = self.rpc_client.get_recent_prioritization_fees(&[]).await?;
        
        if recent_fees.is_empty() {
            return Ok(1000); // Default fee
        }
        
        // Calculate 75th percentile for competitive priority
        let mut fees: Vec<u64> = recent_fees.iter().map(|f| f.prioritization_fee).collect();
        fees.sort_unstable();
        
        let index = (fees.len() as f64 * 0.75) as usize;
        Ok(fees.get(index).copied().unwrap_or(1000))
    }

    async fn confirm_transaction(&self, signature: &Signature) -> Result<(), Box<dyn std::error::Error>> {
        // Wait for transaction confirmation
        let start = Instant::now();
        let timeout = Duration::from_secs(30);
        
        while start.elapsed() < timeout {
            match self.rpc_client.get_signature_status(signature).await? {
                Some(result) => {
                    return result.map_err(|e| format!("Transaction failed: {:?}", e).into());
                }
                None => {
                    tokio::time::sleep(Duration::from_millis(500)).await;
                }
            }
        }
        
        Err("Transaction confirmation timeout".into())
    }

    // Risk management methods
    async fn is_potential_honeypot(&self, token_mint: &str) -> bool {
        // Quick honeypot detection
        // 1. Check if token has sell restrictions
        // 2. Analyze holder distribution
        // 3. Check for suspicious patterns
        
        // Simplified check: try to simulate a small sell
        match self.simulate_sell_transaction(token_mint, 1000).await {
            Ok(_) => false, // Can sell, not a honeypot
            Err(_) => true, // Can't sell, potential honeypot
        }
    }

    async fn simulate_sell_transaction(&self, token_mint: &str, amount: u64) -> Result<(), Box<dyn std::error::Error>> {
        // Use Solana's simulate_transaction to check if sell would succeed
        let quote = self.get_jupiter_quote(
            token_mint,
            "So11111111111111111111111111111111111111112", // SOL
            amount,
        ).await?;
        
        let transaction = self.build_jupiter_swap_transaction(&quote).await?;
        
        let simulation = self.rpc_client.simulate_transaction(&transaction).await?;
        
        if simulation.value.err.is_some() {
            return Err("Simulation failed".into());
        }
        
        Ok(())
    }

    async fn is_suspicious_creator(&self, creator_address: &str) -> bool {
        // Check creator against known scammer database
        // For now, simplified check
        let suspicious_creators = vec![
            "known_scammer_1",
            "known_scammer_2",
        ];
        
        suspicious_creators.contains(&creator_address)
    }

    async fn execute_exit(&self, token_mint: &str) -> Result<Signature, Box<dyn std::error::Error>> {
        println!("🏃 Executing exit for token: {}", token_mint);
        
        // Get current position
        let portfolio = self.portfolio.read().await;
        let position = portfolio.active_positions.get(token_mint)
            .ok_or("Position not found")?;
        
        // Get sell quote
        let sell_quote = self.get_jupiter_quote(
            token_mint,
            "So11111111111111111111111111111111111111112", // SOL
            position.amount,
        ).await?;
        
        // Execute sell
        let sell_tx = self.build_jupiter_swap_transaction(&sell_quote).await?;
        let signature = self.send_transaction_with_priority(sell_tx).await?;
        
        // Update portfolio
        self.update_portfolio_after_sell(token_mint, &sell_quote).await;
        
        Ok(signature)
    }

    async fn update_portfolio_after_sell(&self, token_mint: &str, quote: &JupiterQuote) {
        let mut portfolio = self.portfolio.write().await;
        
        if let Some(position) = portfolio.active_positions.remove(token_mint) {
            // Calculate P&L
            let sol_received = quote.out_amount;
            let sol_invested = (position.amount as f64 * position.entry_price) as u64;
            let profit = sol_received as i64 - sol_invested as i64;
            
            // Update portfolio
            portfolio.sol_balance += sol_received;
            portfolio.daily_pnl += profit as f64 / 1e9; // Convert to SOL
            portfolio.total_pnl += profit as f64 / 1e9;
            
            println!("💰 Trade completed: {} SOL profit", profit as f64 / 1e9);
            
            // Send notification
            self.send_trade_notification(&position, profit as f64 / 1e9).await;
        }
    }

    async fn update_portfolio_after_arbitrage(
        &self,
        opportunity: &ArbitrageOpportunity,
        buy_quote: &JupiterQuote,
        sell_quote: &JupiterQuote,
    ) {
        let mut portfolio = self.portfolio.write().await;
        
        let sol_spent = buy_quote.in_amount;
        let sol_received = sell_quote.out_amount;
        let profit = sol_received as i64 - sol_spent as i64;
        
        portfolio.daily_pnl += profit as f64 / 1e9;
        portfolio.total_pnl += profit as f64 / 1e9;
        
        println!("🔄 Arbitrage profit: {} SOL", profit as f64 / 1e9);
    }

    // Notification system
    async fn send_trade_notification(&self, position: &Position, profit_sol: f64) {
        // Send to Discord/Telegram if configured
        let message = format!(
            "🎯 Trade Completed!\nToken: {}\nProfit: {:.4} SOL (${:.2})\nHold time: {} minutes",
            position.token_mint,
            profit_sol,
            profit_sol * 100.0, // Assuming $100/SOL
            (chrono::Utc::now().timestamp() as u64 - position.entry_time) / 60
        );
        
        // Implementation would send to configured notification channels
        println!("{}", message);
    }

    // Portfolio monitoring and risk management
    async fn monitor_portfolio(&self) {
        let engine_clone = self.clone_for_background();
        
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(10));
            
            loop {
                interval.tick().await;
                engine_clone.update_portfolio_values().await;
                engine_clone.check_risk_limits().await;
            }
        });
    }

    async fn update_portfolio_values(&self) {
        let mut portfolio = self.portfolio.write().await;
        let mut total_value = portfolio.sol_balance as f64 / 1e9 * 100.0; // SOL value in USD
        
        // Update each position's current value
        for (mint, position) in portfolio.active_positions.iter_mut() {
            if let Ok(current_price) = self.get_jupiter_price(mint).await {
                position.current_price = current_price;
                position.pnl = (current_price - position.entry_price) / position.entry_price;
                
                let position_value = position.amount as f64 * current_price;
                total_value += position_value;
            }
        }
        
        portfolio.total_value = total_value;
    }

    async fn check_risk_limits(&self) {
        let portfolio = self.portfolio.read().await;
        
        // Global stop loss: If daily loss > 20%, pause all trading
        if portfolio.daily_pnl < -0.2 * portfolio.total_value {
            println!("🛑 EMERGENCY STOP: Daily loss limit exceeded");
            // Implement emergency stop logic
        }
        
        // Individual position risk: If any position down > 70%, force exit
        for (mint, position) in &portfolio.active_positions {
            if position.pnl < -0.7 {
                println!("🚨 Force exiting position {} due to large loss", mint);
                let _ = self.execute_exit(mint).await;
            }
        }
    }

    // Performance analytics
    async fn calculate_performance_metrics(&self) -> PerformanceMetrics {
        let portfolio = self.portfolio.read().await;
        
        PerformanceMetrics {
            total_trades: portfolio.active_positions.len() as u32,
            win_rate: 0.75, // Calculate from trade history
            average_profit: portfolio.total_pnl / portfolio.active_positions.len() as f64,
            max_drawdown: 0.05, // Calculate from historical data
            sharpe_ratio: 2.1, // Calculate based on returns and volatility
        }
    }
}

// Supporting data structures
#[derive(Debug, Serialize, Deserialize)]
pub struct JupiterQuote {
    pub input_mint: String,
    pub in_amount: u64,
    pub output_mint: String,
    pub out_amount: u64,
    pub other_amount_threshold: u64,
    pub swap_mode: String,
    pub slippage_bps: u16,
    pub platform_fee: Option<PlatformFee>,
    pub price_impact_pct: f64,
    pub route_plan: Vec<RoutePlan>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SwapResponse {
    pub swap_transaction: String,
    pub last_valid_block_height: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PlatformFee {
    pub amount: u64,
    pub fee_bps: u16,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RoutePlan {
    pub swap_info: SwapInfo,
    pub percent: u8,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SwapInfo {
    pub amm_key: String,
    pub label: String,
    pub input_mint: String,
    pub output_mint: String,
    pub in_amount: u64,
    pub out_amount: u64,
    pub fee_amount: u64,
    pub fee_mint: String,
}

#[derive(Debug, Serialize)]
pub struct PerformanceMetrics {
    pub total_trades: u32,
    pub win_rate: f64,
    pub average_profit: f64,
    pub max_drawdown: f64,
    pub sharpe_ratio: f64,
}

// API endpoints for external access
use actix_web::{HttpResponse, HttpRequest};

#[actix_web::get("/api/portfolio")]
pub async fn get_portfolio(
    req: HttpRequest,
    engine: web::Data<TradingEngine>,
) -> ActixResult<HttpResponse> {
    // Get wallet address from JWT token (set by middleware)
    let wallet_address = req.extensions().get::<String>()
        .ok_or_else(|| actix_web::error::ErrorUnauthorized("No wallet address"))?;
    
    let portfolio = engine.portfolio.read().await;
    Ok(HttpResponse::Ok().json(&*portfolio))
}

#[actix_web::get("/api/opportunities")]
pub async fn get_arbitrage_opportunities(
    req: HttpRequest,
    engine: web::Data<TradingEngine>,
) -> ActixResult<HttpResponse> {
    let opportunities = engine.active_opportunities.read().await;
    Ok(HttpResponse::Ok().json(&*opportunities))
}

#[actix_web::post("/api/strategy")]
pub async fn create_strategy(
    req: HttpRequest,
    strategy: web::Json<TradingStrategy>,
    engine: web::Data<TradingEngine>,
) -> ActixResult<HttpResponse> {
    let wallet_address = req.extensions().get::<String>()
        .ok_or_else(|| actix_web::error::ErrorUnauthorized("No wallet address"))?;
    
    // Validate strategy parameters
    if strategy.buy_amount > 10_000_000_000 { // Max 10 SOL per trade
        return Ok(HttpResponse::BadRequest().json("Buy amount too large"));
    }
    
    // Add strategy to user's active strategies
    let mut strategies = engine.strategies.write().await;
    strategies.push(strategy.into_inner());
    
    Ok(HttpResponse::Ok().json("Strategy created successfully"))
}

#[actix_web::post("/api/trade/execute")]
pub async fn execute_manual_trade(
    req: HttpRequest,
    trade_request: web::Json<ManualTradeRequest>,
    engine: web::Data<TradingEngine>,
) -> ActixResult<HttpResponse> {
    let wallet_address = req.extensions().get::<String>()
        .ok_or_else(|| actix_web::error::ErrorUnauthorized("No wallet address"))?;
    
    match trade_request.trade_type.as_str() {
        "pump_sniper" => {
            // Execute pump.fun buy
            match engine.execute_manual_pump_buy(&trade_request).await {
                Ok(signature) => Ok(HttpResponse::Ok().json(serde_json::json!({
                    "success": true,
                    "transaction": signature.to_string(),
                    "message": "Trade executed successfully"
                }))),
                Err(e) => Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                    "success": false,
                    "error": e.to_string()
                })))
            }
        }
        "arbitrage" => {
            // Execute arbitrage trade
            if let Some(opportunity) = engine.active_opportunities.read().await
                .iter().find(|opp| opp.token_mint == trade_request.token_mint) {
                    
                match engine.execute_arbitrage(opportunity).await {
                    Ok((buy_sig, sell_sig)) => Ok(HttpResponse::Ok().json(serde_json::json!({
                        "success": true,
                        "buy_transaction": buy_sig.to_string(),
                        "sell_transaction": sell_sig.to_string(),
                        "message": "Arbitrage executed successfully"
                    }))),
                    Err(e) => Ok(HttpResponse::InternalServerError().json(serde_json::json!({
                        "success": false,
                        "error": e.to_string()
                    })))
                }
            } else {
                Ok(HttpResponse::NotFound().json("Arbitrage opportunity not found"))
            }
        }
        _ => Ok(HttpResponse::BadRequest().json("Invalid trade type"))
    }
}

#[derive(Debug, Deserialize)]
pub struct ManualTradeRequest {
    pub trade_type: String, // "pump_sniper", "arbitrage", "grid"
    pub token_mint: String,
    pub amount: u64,
    pub max_slippage: f64,
}

impl TradingEngine {
    async fn execute_manual_pump_buy(&self, request: &ManualTradeRequest) -> Result<Signature, Box<dyn std::error::Error>> {
        // Create a temporary TokenLaunch for manual trades
        let manual_launch = TokenLaunch {
            mint: request.token_mint.clone(),
            symbol: "MANUAL".to_string(),
            name: "Manual Trade".to_string(),
            initial_liquidity: 0,
            bonding_curve: "".to_string(),
            creator: "".to_string(),
            timestamp: chrono::Utc::now().timestamp() as u64,
            market_cap: 0,
        };
        
        self.execute_pump_fun_buy(&manual_launch).await
    }

    // WebSocket API for real-time updates
    pub async fn start_websocket_server(&self, port: u16) -> Result<(), Box<dyn std::error::Error>> {
        use actix_web_actors::ws;
        use actix::{Actor, StreamHandler, Handler, Message as ActorMessage};
        
        // WebSocket actor for real-time updates
        #[derive(Debug)]
        struct TradingWebSocket {
            engine: Arc<TradingEngine>,
        }
        
        impl Actor for TradingWebSocket {
            type Context = ws::WebsocketContext<Self>;
        }
        
        impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for TradingWebSocket {
            fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
                match msg {
                    Ok(ws::Message::Text(text)) => {
                        // Handle WebSocket commands from frontend
                        if text.trim() == "subscribe_portfolio" {
                            // Subscribe to portfolio updates
                            ctx.text("Portfolio subscription active");
                        }
                    }
                    Ok(ws::Message::Close(reason)) => {
                        ctx.close(reason);
                    }
                    _ => {}
                }
            }
        }
        
        println!("WebSocket server would start on port {}", port);
        Ok(())
    }

    // Configuration and strategy management
    pub async fn load_strategies_from_config(&self) -> Result<(), Box<dyn std::error::Error>> {
        // Load pre-configured strategies
        let default_strategies = vec![
            TradingStrategy {
                id: "pump_sniper_aggressive".to_string(),
                name: "Aggressive Pump Sniper".to_string(),
                strategy_type: StrategyType::PumpSniper,
                buy_amount: 100_000_000, // 0.1 SOL
                max_slippage: 5.0,
                take_profit_percentage: 300.0, // 3x
                stop_loss_percentage: 50.0,
                max_hold_time: Duration::from_mins(15),
                min_liquidity: 1_000_000_000, // 1 SOL minimum
                risk_score_threshold: 0.7,
            },
            TradingStrategy {
                id: "arbitrage_scanner".to_string(),
                name: "Cross-DEX Arbitrage".to_string(),
                strategy_type: StrategyType::Arbitrage,
                buy_amount: 500_000_000, // 0.5 SOL
                max_slippage: 1.0,
                take_profit_percentage: 0.5, // 0.5% minimum profit
                stop_loss_percentage: 0.0, // No stop loss for arbitrage
                max_hold_time: Duration::from_secs(30), // Very quick arbitrage
                min_liquidity: 5_000_000_000, // 5 SOL minimum
                risk_score_threshold: 0.9,
            },
        ];
        
        let mut strategies = self.strategies.write().await;
        strategies.extend(default_strategies);
        
        Ok(())
    }
}

// Main application entry point
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("🦈 Starting CryptoShark Trading Engine...");
    
    // Load configuration
    let rpc_url = std::env::var("SOLANA_RPC_URL")
        .unwrap_or_else(|_| "https://api.mainnet-beta.solana.com".to_string());
    let grpc_url = std::env::var("SOLANA_GRPC_URL")
        .unwrap_or_else(|_| "http://grpc.solana.com:10000".to_string());
    let redis_url = std::env::var("REDIS_URL")
        .unwrap_or_else(|_| "redis://127.0.0.1:6379".to_string());
    let wallet_path = std::env::var("WALLET_PATH")
        .unwrap_or_else(|_| "./wallet.json".to_string());
    
    // Initialize trading engine
    let trading_engine = match TradingEngine::new(rpc_url, grpc_url, redis_url, wallet_path).await {
        Ok(engine) => {
            println!("✅ Trading engine initialized");
            engine
        }
        Err(e) => {
            eprintln!("❌ Failed to initialize trading engine: {}", e);
            std::process::exit(1);
        }
    };
    
    // Load default strategies
    trading_engine.load_strategies_from_config().await.unwrap();
    
    // Start portfolio monitoring
    trading_engine.monitor_portfolio().await;
    
    // Start HTTP server
    let server_data = web::Data::new(trading_engine);
    
    HttpServer::new(move || {
        App::new()
            .app_data(server_data.clone())
            .service(get_portfolio)
            .service(get_arbitrage_opportunities)
            .service(create_strategy)
            .service(execute_manual_trade)
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}

// Cargo.toml dependencies needed:
/*
[dependencies]
actix-web = "4.0"
actix-web-actors = "4.2"
actix = "0.13"
tokio = { version = "1.0", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
solana-client = "1.17"
solana-sdk = "1.17"
solana-program = "1.17"
solana-account-decoder = "1.17"
reqwest = { version = "0.11", features = ["json"] }
redis = { version = "0.23", features = ["tokio-comp"] }
tonic = "0.10"
yellowstone-grpc-client = "1.7"
yellowstone-grpc-proto = "1.7"
bs58 = "0.5"
bincode = "1.3"
chrono = { version = "0.4", features = ["serde"] }
uuid = { version = "1.0", features = ["v4"] }
*/