use ic_cdk_macros::init;
use candid::Principal;

pub mod state;
pub mod updates;
pub mod queries;

use types::solana::*;

#[init]
fn init(args: InitArgs) {
    state::init_marketplace(args.admin);
}

ic_cdk::export_candid!();