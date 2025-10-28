use candid::Principal;
use ic_cdk_macros::{init, query, update};

pub mod types;
pub mod state;
pub mod chains;
pub mod queries;
pub mod mutations;
pub mod utils;

use types::*;

#[derive(candid::CandidType, serde::Deserialize)]
pub struct InitArgs {
    pub admin: Principal,
}

#[init]
fn init(args: InitArgs) {
    // Initialize marketplace
    ic_cdk::println!("Marketplace canister initialized with admin: {}", args.admin);
}

// Re-export public API
pub use queries::*;
pub use mutations::*;

ic_cdk::export_candid!();
