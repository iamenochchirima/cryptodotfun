use candid::{Nat, Principal};
use ic_cdk_macros::update;
use crate::types::{DeployCollectionArgs, DeployCollectionResponse, CollectionInfo, CollectionStatus};
use crate::state::state::*;
use crate::errors::MarketplaceError;
use crate::utils::canister_management::{deploy_nft_collection, NFTCollectionInitArgs};

#[update]
pub async fn deploy_collection(args: DeployCollectionArgs) -> Result<DeployCollectionResponse, MarketplaceError> {
    let caller = ic_cdk::api::msg_caller();
    let current_time = ic_cdk::api::time();

    if caller == Principal::anonymous() {
        return Err(MarketplaceError::NotAuthorized);
    }

    let _creation_fee = MARKETPLACE_CONFIG.with(|config| {
        config.borrow().get().collection_creation_fee.clone()
    });

    // TODO: Implement fee payment check here
    // For now, we'll proceed without fee validation
    // In production, you should verify the caller has paid the creation fee

    // Validate collection parameters
    if args.name.is_empty() {
        return Err(MarketplaceError::InvalidCollectionName);
    }

    if args.symbol.is_empty() {
        return Err(MarketplaceError::InvalidCollectionSymbol);
    }

    // Prepare initialization arguments for the NFT canister
    let init_args = NFTCollectionInitArgs {
        name: args.name.clone(),
        symbol: args.symbol.clone(),
        description: if args.description.is_empty() { None } else { Some(args.description.clone()) },
        logo: if args.logo.is_empty() { None } else { Some(args.logo.clone()) },
        supply_cap: if args.supply_cap == 0 { None } else { Some(Nat::from(args.supply_cap)) },
        owner: caller,
    };

    // Deploy the NFT collection canister
    let collection_id = match deploy_nft_collection(caller, init_args).await {
        Ok(canister_id) => canister_id,
        Err(e) => {
            ic_cdk::println!("Failed to deploy collection: {}", e);
            return Err(MarketplaceError::CanisterCreationFailed(e));
        }
    };

    // Generate a unique transaction ID
    let transaction_id = crate::state::get_next_transaction_id();

    // Create collection info
    let collection_info = CollectionInfo {
        id: collection_id,
        creator: caller,
        name: args.name.clone(),
        symbol: args.symbol.clone(),
        description: if args.description.is_empty() { None } else { Some(args.description.clone()) },
        logo: if args.logo.is_empty() { None } else { Some(args.logo.clone()) },
        supply_cap: if args.supply_cap == 0 { None } else { Some(Nat::from(args.supply_cap)) },
        created_at: current_time,
        status: CollectionStatus::AssetsPending,  // Start with AssetsPending status
        total_supply: Nat::from(0u64),
        floor_price: None,
        total_volume: Nat::from(0u64),
    };

    // Store collection in state
    COLLECTIONS.with(|collections| {
        collections.borrow_mut().insert(collection_id, collection_info.clone());
    });

    // Add to user's collections
    USER_COLLECTIONS.with(|user_collections| {
        user_collections
            .borrow_mut()
            .entry(caller)
            .or_insert_with(Vec::new)
            .push(collection_id);
    });

    // Update marketplace stats
    crate::state::increment_total_collections();

    // Log the event
    let event = crate::types::MarketplaceEvent::CollectionCreated {
        collection_id,
        creator: caller,
        name: args.name.clone(),
        timestamp: current_time,
    };

    MARKETPLACE_EVENTS.with(|events| {
        events.borrow_mut().push(event);
    });

    Ok(DeployCollectionResponse {
        collection_id,
        owner: caller,
        created_at: current_time,
        transaction_id,
    })
}

#[update]
pub async fn update_collection_status(
    collection_id: Principal,
    status: CollectionStatus,
) -> Result<(), MarketplaceError> {
    let caller = ic_cdk::api::msg_caller();

    // Get collection info
    let collection = COLLECTIONS.with(|collections| {
        collections.borrow().get(&collection_id)
    }).ok_or(MarketplaceError::CollectionNotFound)?;

    // Check if caller is the creator or admin
    let is_admin = MARKETPLACE_CONFIG.with(|config| {
        config.borrow().get().admin == caller
    });

    if collection.creator != caller && !is_admin {
        return Err(MarketplaceError::NotAuthorized);
    }

    // Update collection status
    COLLECTIONS.with(|collections| {
        if let Some(mut collection) = collections.borrow_mut().get(&collection_id) {
            collection.status = status;
            collections.borrow_mut().insert(collection_id, collection);
        }
    });

    Ok(())
}

#[update]
pub async fn activate_collection(collection_id: Principal) -> Result<(), MarketplaceError> {
    let caller = ic_cdk::api::msg_caller();

    // Get collection info
    let mut collection = COLLECTIONS.with(|collections| {
        collections.borrow().get(&collection_id)
    }).ok_or(MarketplaceError::CollectionNotFound)?;

    // Check if caller is the creator
    if collection.creator != caller {
        return Err(MarketplaceError::NotAuthorized);
    }

    // Only allow activation from AssetsPending status
    if collection.status != CollectionStatus::AssetsPending {
        return Err(MarketplaceError::InvalidInput("Collection is not in AssetsPending status".to_string()));
    }

    // Update collection status to Active
    collection.status = CollectionStatus::Active;

    // Store updated collection
    COLLECTIONS.with(|collections| {
        collections.borrow_mut().insert(collection_id, collection);
    });

    // Log the event
    let event = crate::types::MarketplaceEvent::CollectionActivated {
        collection_id,
        creator: caller,
        timestamp: ic_cdk::api::time(),
    };

    MARKETPLACE_EVENTS.with(|events| {
        events.borrow_mut().push(event);
    });

    Ok(())
}

#[update]
pub async fn get_user_collections(user: Principal) -> Vec<CollectionInfo> {
    let collection_ids = USER_COLLECTIONS.with(|user_collections| {
        user_collections
            .borrow()
            .get(&user)
            .cloned()
            .unwrap_or_default()
    });

    let mut collections = Vec::new();
    for id in collection_ids {
        if let Some(collection) = COLLECTIONS.with(|c| c.borrow().get(&id)) {
            collections.push(collection);
        }
    }

    collections
}