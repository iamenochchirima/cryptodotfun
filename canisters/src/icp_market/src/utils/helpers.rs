use ic_cdk::api::time;
use candid::Principal;
use ic_ledger_types::{AccountIdentifier, Subaccount};

fn to_32bits(num: u32) -> Vec<u8> {
    num.to_be_bytes().to_vec()
}

pub fn principal_to_account_id(principal: Principal) -> String {
    let subaccount = Subaccount([0; 32]);
    let account_id = AccountIdentifier::new(&principal, &subaccount);
    account_id.to_string()
}

pub fn get_token_identifier(canister: &str, index: u32) -> String {
    let padding = b"\x0Atid";
    
    let principal = Principal::from_text(canister).expect("Invalid canister principal");
    let canister_bytes = principal.as_slice();
    
    let index_bytes = to_32bits(index);

    let mut combined = Vec::new();
    combined.extend_from_slice(padding);
    combined.extend_from_slice(canister_bytes);
    combined.extend_from_slice(&index_bytes);

    Principal::from_slice(&combined).to_text()  
}

pub fn pseudo_random_bytes() -> [u8; 8] {
    time().to_le_bytes()
}