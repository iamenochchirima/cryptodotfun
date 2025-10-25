use candid::Principal;

pub const ICP_LEDGER_CANISTER_ID: &str = "rrkah-fqaaa-aaaaa-aaaaq-cai";
pub const CKBTC_LEDGER_CANISTER_ID: &str = "mxzaz-hqaaa-aaaar-qaada-cai";
pub const CKETH_LEDGER_CANISTER_ID: &str = "ss2fx-dyaaa-aaaar-qacoq-cai";


pub fn get_icp_ledger_principal() -> Principal {
    Principal::from_text(ICP_LEDGER_CANISTER_ID).expect("Invalid ICP ledger canister ID")
}

pub fn get_ckbtc_ledger_principal() -> Principal {
    Principal::from_text(CKBTC_LEDGER_CANISTER_ID).expect("Invalid ckBTC ledger canister ID")
}

pub fn get_cketh_ledger_principal() -> Principal {
    Principal::from_text(CKETH_LEDGER_CANISTER_ID).expect("Invalid ckETH ledger canister ID")
}