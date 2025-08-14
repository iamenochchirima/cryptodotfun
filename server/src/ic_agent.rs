use ic_agent::{Agent, identity::Secp256k1Identity};
use candid::{Encode, Decode, Principal};
use std::sync::Arc;
use tokio::sync::OnceCell;
use crate::config::AppConfig;
use base64ct::{Base64, Encoding};

// Global instance of the backend actor
static BACKEND_ACTOR: OnceCell<Arc<BackendActor>> = OnceCell::const_new();

#[derive(Debug, Clone)]
pub struct BackendActor {
    pub agent: Agent,
    pub canister_id: Principal,
    pub config: AppConfig,
}

impl BackendActor {
    pub async fn init(config: AppConfig) -> Result<Arc<Self>, Box<dyn std::error::Error + Send + Sync>> {
        println!("🔄 Initializing IC Backend Actor...");
        
        let identity = Self::load_identity(&config)?;

        println!("Canister ID: {}", config.identity_provider_canister_id);

        let agent = Agent::builder()
            .with_url(&config.ic_host)
            .with_identity(identity)
            .build()?;

        if config.is_local() {
            println!("🔑 Fetching root key for local development...");
            agent.fetch_root_key().await?;
        }

        // Parse canister ID
        let canister_id = Principal::from_text(&config.identity_provider_canister_id)
            .map_err(|e| format!("Invalid canister ID: {}", e))?;

        let backend_actor = Arc::new(BackendActor {
            agent,
            canister_id,
            config: config.clone(),
        });

        println!("✅ IC Backend Actor initialized successfully!");
        println!("🌐 Network: {}", config.network);
        println!("🏠 Host: {}", config.ic_host);
        println!("📦 Canister ID: {}", config.identity_provider_canister_id);
        println!("🔐 Identity PEM: {}", config.identity_pem_path);

        Ok(backend_actor)
    }

    pub async fn instance() -> &'static Arc<BackendActor> {
        BACKEND_ACTOR.get().expect("BackendActor not initialized. Call BackendActor::init() first.")
    }

    pub async fn initialize_global(config: AppConfig) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let actor = Self::init(config).await?;
        BACKEND_ACTOR.set(actor).map_err(|_| "BackendActor already initialized")?;
        Ok(())
    }

    fn load_identity(config: &AppConfig) -> Result<Secp256k1Identity, Box<dyn std::error::Error + Send + Sync>> {
        if let Ok(private_key_b64) = std::env::var("IC_PRIVATE_KEY_B64") {
            if !private_key_b64.is_empty() {
                println!("🔐 Loading identity from IC_PRIVATE_KEY_B64 environment variable...");
                return Self::load_identity_from_base64(&private_key_b64);
            }
        }

        if let Ok(private_key) = std::env::var("IC_PRIVATE_KEY") {
            if !private_key.is_empty() {
                println!("🔐 Loading identity from IC_PRIVATE_KEY environment variable...");
                return Self::load_identity_from_env_string(&private_key);
            }
        }

        Self::load_identity_from_pem(&config.identity_pem_path)
    }

    fn load_identity_from_base64(private_key_b64: &str) -> Result<Secp256k1Identity, Box<dyn std::error::Error + Send + Sync>> {
        let pem_bytes = Base64::decode_vec(private_key_b64)
            .map_err(|e| format!("Failed to decode base64 private key: {}", e))?;
        
        let identity = Secp256k1Identity::from_pem(pem_bytes.as_slice())
            .map_err(|e| format!("Failed to load identity from decoded base64: {}", e))?;
        
        Ok(identity)
    }

    fn load_identity_from_env_string(private_key: &str) -> Result<Secp256k1Identity, Box<dyn std::error::Error + Send + Sync>> {
        // Create a proper PEM content from the private key
        let pem_content = if private_key.starts_with("-----BEGIN") {
            private_key.replace("\\n", "\n")
        } else {
            format!(
                "-----BEGIN EC PRIVATE KEY-----\n{}\n-----END EC PRIVATE KEY-----",
                private_key
            )
        };

        let identity = Secp256k1Identity::from_pem(pem_content.as_bytes())
            .map_err(|e| format!("Failed to load identity from environment variable: {}", e))?;
        
        Ok(identity)
    }

    fn load_identity_from_pem(pem_path: &str) -> Result<Secp256k1Identity, Box<dyn std::error::Error + Send + Sync>> {
        match Secp256k1Identity::from_pem_file(pem_path) {
            Ok(identity) => Ok(identity),
            Err(_) => {
                Err(format!("Failed to load identity from PEM file: {}", pem_path).into())
            }
        }
    }

    pub async fn query<T, R>(&self, method: &str, args: T) -> Result<R, Box<dyn std::error::Error + Send + Sync>>
    where
        T: candid::CandidType,
        R: for<'de> candid::Deserialize<'de> + candid::CandidType,
    {
        let arg = Encode!(&args)?;
        let response = self.agent
            .query(&self.canister_id, method)
            .with_arg(arg)
            .call()
            .await?;

        let result = Decode!(response.as_slice(), R)?;
        Ok(result)
    }

    pub async fn update<T, R>(&self, method: &str, args: T) -> Result<R, Box<dyn std::error::Error + Send + Sync>>
    where
        T: candid::CandidType,
        R: for<'de> candid::Deserialize<'de> + candid::CandidType,
    {
        let arg = Encode!(&args)?;
        let response = self.agent
            .update(&self.canister_id, method)
            .with_arg(arg)
            .call_and_wait()
            .await?;

        let result = Decode!(response.as_slice(), R)?;
        Ok(result)
    }

    pub fn get_principal(&self) -> Principal {
        self.agent.get_principal().unwrap_or(Principal::anonymous())
    }
}

pub async fn get_backend_actor() -> &'static Arc<BackendActor> {
    BackendActor::instance().await
}

#[derive(candid::CandidType, candid::Deserialize, serde::Serialize)]
pub struct UserData {
    pub username: String,
    pub email: Option<String>,
    pub principal: Principal,
    pub created_at: u64,
}

pub async fn check_username_availability(username: &str) -> Result<bool, Box<dyn std::error::Error + Send + Sync>> {
    let actor = get_backend_actor().await;
    
    #[derive(candid::CandidType)]
    struct CheckUsernameArgs {
        username: String,
    }

    let args = CheckUsernameArgs {
        username: username.to_string(),
    };

    let result: bool = actor.query("check_username_availability", args).await?;
    Ok(result)
}