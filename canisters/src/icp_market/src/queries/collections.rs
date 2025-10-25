use candid::Principal;
use ic_cdk::query;
use types::icp::{CollectionInfo, IcpPaginatedCollections};
use crate::state::{get_collections_by_creator as get_collections_by_creator_state, state::*};
use crate::errors::MarketplaceError;

#[query]
fn get_collection_info(collection_id: Principal) -> Result<CollectionInfo, MarketplaceError> {
    COLLECTIONS.with(|collections| {
        collections.borrow()
            .get(&collection_id)
            .ok_or(MarketplaceError::CollectionNotFound)
    })
}

#[query]
fn get_collections_by_creator(creator: Principal) -> Vec<CollectionInfo> {
    let collection_ids = get_collections_by_creator_state(&creator);

    COLLECTIONS.with(|collections| {
        let map = collections.borrow();
        collection_ids.iter()
            .filter_map(|id| map.get(id))
            .collect()
    })
}

#[query]
fn get_all_collections(start: Option<u64>, limit: Option<u64>) -> IcpPaginatedCollections {
    let start_idx = start.unwrap_or(0) as usize;
    let limit_val = limit.unwrap_or(100).min(100) as usize;
    
    COLLECTIONS.with(|collections| {
        let all_collections: Vec<CollectionInfo> = collections.borrow()
            .iter()
            .map(|entry| entry.value())
            .collect();
        
        let total_count = all_collections.len() as u64;
        
        let paginated_collections = all_collections
            .into_iter()
            .skip(start_idx)
            .take(limit_val)
            .collect();
        
        IcpPaginatedCollections {
            collections: paginated_collections,
            total_count,
            has_more: (start_idx + limit_val) < total_count as usize,
        }
    })
}

#[query]
fn get_collection_by_name(name: String) -> Result<CollectionInfo, MarketplaceError> {
    COLLECTIONS_BY_NAME.with(|names| {
        names.borrow()
            .get(&name)
            .ok_or(MarketplaceError::CollectionNotFound)
            .and_then(|collection_id| {
                COLLECTIONS.with(|collections| {
                    collections.borrow()
                        .get(&collection_id)
                        .ok_or(MarketplaceError::CollectionNotFound)
                })
            })
    })
}