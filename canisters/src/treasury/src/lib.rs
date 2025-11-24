use candid::{CandidType, Deserialize};
use ic_cdk::{query, update};
use serde::Serialize;

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct PlatformWallets {
    pub solana: Option<String>,
    pub bitcoin: Option<String>,
    pub ethereum: Option<String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct ChainBalance {
    pub chain: String,
    pub balance: f64,
    pub address: String,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct PaymentRecord {
    pub id: String,
    pub chain: String,
    pub amount: f64,
    pub from: String,
    pub purpose: String,
    pub timestamp: u64,
    pub tx_signature: String,
}

#[query]
fn get_platform_wallets() -> PlatformWallets {
    PlatformWallets {
        solana: None,
        bitcoin: None,
        ethereum: None,
    }
}

#[query]
fn get_balances() -> Vec<ChainBalance> {
    //TODO: 
    vec![]
}

#[update]
fn record_payment(payment: PaymentRecord) -> Result<String, String> {
    Ok(payment.id)
}

#[query]
fn get_payments() -> Vec<PaymentRecord> {
    vec![]
}

ic_cdk::export_candid!();
