use candid::{Nat, Principal};
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc2::transfer_from::{TransferFromArgs, TransferFromError};
use crate::errors::MarketplaceError;
use crate::constants::get_icp_ledger_principal;

pub async fn process_icp_fee_payment(payer: Principal, amount: Nat) -> Result<(), MarketplaceError> {
    let marketplace_account = Account {
        owner: ic_cdk::api::canister_self(),
        subaccount: None,
    };
    
    let transfer_args = TransferFromArgs {
        spender_subaccount: None,
        from: Account {
            owner: payer,
            subaccount: None,
        },
        to: marketplace_account,
        amount,
        fee: None,
        memo: Some(b"collection_creation_fee".to_vec().into()),
        created_at_time: Some(ic_cdk::api::time()),
    };
    
    let icp_ledger = get_icp_ledger_principal();
    
    let result: Result<(Result<Nat, TransferFromError>,), _> = ic_cdk::call(
        icp_ledger,
        "icrc2_transfer_from",
        (transfer_args,)
    ).await;
    
    match result {
        Ok((Ok(_block_index),)) => Ok(()),
        Ok((Err(transfer_error),)) => Err(MarketplaceError::PaymentFailed(format!("{:?}", transfer_error))),
        Err(call_error) => Err(MarketplaceError::PaymentFailed(
            format!("Call failed: {:?}", call_error)
        )),
    }
}

pub async fn process_sale_payment(
    buyer: Principal,
    seller: Principal,
    seller_amount: Nat,
    marketplace_fee: Nat,
) -> Result<(), MarketplaceError> {
    let icp_ledger = get_icp_ledger_principal();
    let marketplace_canister = ic_cdk::api::canister_self();
    
    // Transfer payment from buyer to seller
    let seller_transfer_args = TransferFromArgs {
        spender_subaccount: None,
        from: Account {
            owner: buyer,
            subaccount: None,
        },
        to: Account {
            owner: seller,
            subaccount: None,
        },
        amount: seller_amount,
        fee: None,
        memo: Some(b"marketplace_sale".to_vec().into()),
        created_at_time: Some(ic_cdk::api::time()),
    };
    
    // Transfer marketplace fee from buyer to marketplace
    let fee_transfer_args = TransferFromArgs {
        spender_subaccount: None,
        from: Account {
            owner: buyer,
            subaccount: None,
        },
        to: Account {
            owner: marketplace_canister,
            subaccount: None,
        },
        amount: marketplace_fee,
        fee: None,
        memo: Some(b"marketplace_fee".to_vec().into()),
        created_at_time: Some(ic_cdk::api::time()),
    };
    
    // Execute both transfers
    let seller_result: Result<(Result<Nat, TransferFromError>,), _> = ic_cdk::call(
        icp_ledger,
        "icrc2_transfer_from",
        (seller_transfer_args,)
    ).await;
    
    let fee_result: Result<(Result<Nat, TransferFromError>,), _> = ic_cdk::call(
        icp_ledger,
        "icrc2_transfer_from",
        (fee_transfer_args,)
    ).await;
    
    // Check if both transfers succeeded
    match (seller_result, fee_result) {
        (Ok((Ok(_),)), Ok((Ok(_),))) => Ok(()),
        (Ok((Err(seller_error),)), _) => Err(MarketplaceError::PaymentFailed(
            format!("Seller payment failed: {:?}", seller_error)
        )),
        (_, Ok((Err(fee_error),))) => Err(MarketplaceError::PaymentFailed(
            format!("Fee payment failed: {:?}", fee_error)
        )),
        (Err(seller_call_error), _) => Err(MarketplaceError::PaymentFailed(
            format!("Seller payment call failed: {:?}", seller_call_error)
        )),
        (_, Err(fee_call_error)) => Err(MarketplaceError::PaymentFailed(
            format!("Fee payment call failed: {:?}", fee_call_error)
        )),
    }
}

pub fn calculate_marketplace_fee(price: &Nat, fee_percentage: u16) -> Nat {
    // fee_percentage is in basis points (e.g., 250 = 2.5%)
    let fee_basis_points = Nat::from(fee_percentage as u64);
    let basis_points_total = Nat::from(10_000u64);
    
    (price.clone() * fee_basis_points) / basis_points_total
}