use candid::Principal;
use ic_cdk::query;

use types::solana::{
    SolanaCollection, PaginatedCollections, SolanaMarketplaceStats,
    CollectionFilter, CollectionQueryArgs, DeploymentStatus,
};
use crate::state::{
    get_collection, get_collections_by_owner, get_collections_paginated,
    get_total_collections, count_collections_by_status, count_unique_creators,
};

#[query]
pub fn get_collection_by_id(collection_id: String) -> Result<SolanaCollection, String> {
    get_collection(&collection_id).ok_or("Collection not found".to_string())
}

#[query]
pub fn get_user_collections(owner: Option<Principal>) -> Vec<SolanaCollection> {
    let owner_principal = owner.unwrap_or_else(|| ic_cdk::caller());

    let collection_ids = get_collections_by_owner(&owner_principal);

    collection_ids
        .iter()
        .filter_map(|id| get_collection(id))
        .collect()
}

#[query]
pub fn query_collections(args: CollectionQueryArgs) -> PaginatedCollections {
    let (mut collections, _total) = get_collections_paginated(0, 10000);

    collections = match args.filter {
        CollectionFilter::All => collections,
        CollectionFilter::ByStatus(status) => {
            collections.into_iter()
                .filter(|c| c.deployment_status == status)
                .collect()
        },
        CollectionFilter::ByOwner(owner) => {
            collections.into_iter()
                .filter(|c| c.owner == owner)
                .collect()
        },
        CollectionFilter::Deployed => {
            collections.into_iter()
                .filter(|c| matches!(c.deployment_status, DeploymentStatus::Deployed))
                .collect()
        },
    };

    let total_filtered = collections.len() as u64;

    // Apply pagination
    let paginated: Vec<SolanaCollection> = collections
        .into_iter()
        .skip(args.offset as usize)
        .take(args.limit as usize)
        .collect();

    let has_more = (args.offset + args.limit) < total_filtered;

    PaginatedCollections {
        collections: paginated,
        total_count: total_filtered,
        has_more,
    }
}

/// Get all collections with simple pagination
#[query]
pub fn get_all_collections(offset: u64, limit: u64) -> PaginatedCollections {
    let limit = limit.min(100); // Max 100 per page

    let (collections, total) = get_collections_paginated(offset, limit);

    let has_more = (offset + limit) < total;

    PaginatedCollections {
        collections,
        total_count: total,
        has_more,
    }
}

/// Get marketplace statistics
#[query]
pub fn get_marketplace_stats() -> SolanaMarketplaceStats {
    let total_collections = get_total_collections();
    let deployed_collections = count_collections_by_status(&DeploymentStatus::Deployed);
    let draft_collections = count_collections_by_status(&DeploymentStatus::Draft);
    let failed_count = count_collections_by_status(&DeploymentStatus::Failed("".to_string()));
    let total_creators = count_unique_creators();

    SolanaMarketplaceStats {
        total_collections,
        deployed_collections,
        draft_collections,
        failed_collections: failed_count,
        total_creators,
    }
}

/// Check if a collection name is available
#[query]
pub fn is_name_available(name: String) -> bool {
    !crate::state::name_exists(&name)
}
