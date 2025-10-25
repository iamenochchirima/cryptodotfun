use candid::Nat;
use ic_cdk::query;
use crate::types::MarketplaceStats;
use crate::state::state::*;

#[query]
fn get_marketplace_stats() -> MarketplaceStats {
    let total_collections = TOTAL_COLLECTIONS_CREATED.with(|count| count.borrow().get().clone());
    
    let total_volume = TOTAL_VOLUME_TRADED.with(|volume| {
        Nat::from(volume.borrow().get().clone())
    });
    
    let config = MARKETPLACE_CONFIG.with(|c| c.borrow().get().clone());
    
    let active_collections = COLLECTIONS.with(|collections| {
        collections.borrow().iter().count() as u64
    });
    
    MarketplaceStats {
        total_collections,
        total_volume,
        collection_creation_fee: config.collection_creation_fee,
        marketplace_fee_percentage: config.marketplace_fee_percentage,
        active_collections,
    }
}

#[query]
fn get_marketplace_config() -> crate::types::MarketplaceConfig {
    MARKETPLACE_CONFIG.with(|config| config.borrow().get().clone())
}

#[query]
fn get_admin() -> candid::Principal {
    ADMIN.with(|admin| admin.borrow().get().clone())
}