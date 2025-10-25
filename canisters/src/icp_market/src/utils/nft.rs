use candid::{Nat, Principal};
use icrc_ledger_types::icrc1::account::Account;
use crate::errors::MarketplaceError;

pub async fn verify_token_ownership(
    collection_id: Principal,
    token_id: Nat,
    owner: Principal
) -> Result<(), MarketplaceError> {
    // Call ICRC-7 icrc7_owner_of to verify ownership
    let result: Result<(Vec<Option<Account>>,), _> = ic_cdk::call(
        collection_id,
        "icrc7_owner_of",
        (vec![token_id],)
    ).await;
    
    match result {
        Ok((owners,)) => {
            if let Some(Some(token_owner)) = owners.first() {
                if token_owner.owner == owner {
                    Ok(())
                } else {
                    Err(MarketplaceError::TokenNotOwned)
                }
            } else {
                Err(MarketplaceError::TokenNotFound)
            }
        }
        Err(_) => Err(MarketplaceError::SystemError("Failed to verify token ownership".to_string())),
    }
}

pub async fn verify_marketplace_approval(
    collection_id: Principal,
    token_id: Nat,
    owner: Principal
) -> Result<(), MarketplaceError> {
    let marketplace_canister = ic_cdk::api::canister_self();
    
    // Call ICRC-37 icrc37_is_approved to check if marketplace can transfer the token
    let result: Result<(Vec<bool>,), _> = ic_cdk::call(
        collection_id,
        "icrc37_is_approved",
        (vec![(
            token_id,
            Account { owner, subaccount: None },
            Account { owner: marketplace_canister, subaccount: None }
        )],)
    ).await;
    
    match result {
        Ok((approvals,)) => {
            if approvals.first() == Some(&true) {
                Ok(())
            } else {
                Err(MarketplaceError::InsufficientApproval)
            }
        }
        Err(_) => Err(MarketplaceError::SystemError("Failed to verify approval".to_string())),
    }
}

pub async fn transfer_nft(
    collection_id: Principal,
    token_id: Nat,
    from: Principal,
    to: Principal,
) -> Result<(), MarketplaceError> {
    // Use ICRC-37 icrc37_transfer_from to transfer the NFT
    let transfer_args = vec![(
        token_id,
        Account { owner: from, subaccount: None },
        Account { owner: to, subaccount: None },
    )];
    
    let result: Result<(Vec<Result<Nat, String>>,), _> = ic_cdk::call(
        collection_id,
        "icrc37_transfer_from",
        (transfer_args,)
    ).await;
    
    match result {
        Ok((transfer_results,)) => {
            if let Some(Ok(_)) = transfer_results.first() {
                Ok(())
            } else {
                Err(MarketplaceError::TransferFailed("NFT transfer failed".to_string()))
            }
        }
        Err(call_error) => Err(MarketplaceError::TransferFailed(
            format!("Transfer call failed: {:?}", call_error)
        )),
    }
}