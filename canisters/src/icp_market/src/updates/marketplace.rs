use candid::{Nat, Principal};
use ic_cdk_macros::update;
use crate::types::MarketplaceConfig;
use crate::state::state::*;
use crate::errors::MarketplaceError;

#[update]
fn update_marketplace_config(config: MarketplaceConfig) -> Result<(), MarketplaceError> {
    let caller = ic_cdk::api::msg_caller();
    
    // Check if caller is admin
    let admin = ADMIN.with(|a| a.borrow().get().clone());
    if caller != admin {
        return Err(MarketplaceError::NotAuthorized);
    }
    
    // Update config
    MARKETPLACE_CONFIG.with(|c| {
        c.borrow_mut().set(config);
    });
    
    Ok(())
}

#[update]
fn update_collection_creation_fee(fee: Nat) -> Result<(), MarketplaceError> {
    let caller = ic_cdk::api::msg_caller();
    
    // Check if caller is admin
    let admin = ADMIN.with(|a| a.borrow().get().clone());
    if caller != admin {
        return Err(MarketplaceError::NotAuthorized);
    }
    
    // Update fee
    MARKETPLACE_CONFIG.with(|c| {
        let mut config = c.borrow().get().clone();
        config.collection_creation_fee = fee;
        c.borrow_mut().set(config);
    });
    
    Ok(())
}

#[update]
fn update_marketplace_fee_percentage(percentage: u16) -> Result<(), MarketplaceError> {
    let caller = ic_cdk::api::msg_caller();
    
    // Check if caller is admin
    let admin = ADMIN.with(|a| a.borrow().get().clone());
    if caller != admin {
        return Err(MarketplaceError::NotAuthorized);
    }
    
    // Validate percentage (max 10% = 1000 basis points)
    if percentage > 1000 {
        return Err(MarketplaceError::InvalidFeePercentage);
    }
    
    // Update percentage
    MARKETPLACE_CONFIG.with(|c| {
        let mut config = c.borrow().get().clone();
        config.marketplace_fee_percentage = percentage;
        c.borrow_mut().set(config);
    });
    
    Ok(())
}

#[update]
fn transfer_admin(new_admin: Principal) -> Result<(), MarketplaceError> {
    let caller = ic_cdk::api::msg_caller();
    
    // Check if caller is current admin
    let current_admin = ADMIN.with(|a| a.borrow().get().clone());
    if caller != current_admin {
        return Err(MarketplaceError::NotAuthorized);
    }
    
    // Transfer admin
    ADMIN.with(|a| {
        a.borrow_mut().set(new_admin);
    });
    
    Ok(())
}