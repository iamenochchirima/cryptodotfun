use candid::{Nat, Principal};
use ic_cdk_macros::init;

pub mod constants;
pub mod state;
pub mod errors;
pub mod utils;
pub mod updates;
pub mod queries;

use types::icp::*;
use crate::errors::MarketplaceError;

#[init]
fn init(args: IcpInitArgs) {
    state::init_marketplace(args.admin, args.collection_creation_fee, args.marketplace_fee_percentage);
}

ic_cdk::export_candid!();