use candid::Principal;
use ic_cdk::query;
use crate::types::{ListingInfo, PaginatedListings, ListingStatus, SaleInfo};
use crate::state::state::*;
use crate::errors::MarketplaceError;

#[query]
fn get_listing(listing_id: u64) -> Result<ListingInfo, MarketplaceError> {
    LISTINGS.with(|listings| {
        listings.borrow()
            .get(&listing_id)
            .ok_or(MarketplaceError::ListingNotFound)
    })
}

#[query]
fn get_active_listings(start: Option<u64>, limit: Option<u64>) -> PaginatedListings {
    let start_idx = start.unwrap_or(0) as usize;
    let limit_val = limit.unwrap_or(100).min(100) as usize;
    
    LISTINGS.with(|listings| {
        let active_listings: Vec<ListingInfo> = listings.borrow()
            .iter()
            .map(|entry| entry.value())
            .filter(|listing| listing.status == ListingStatus::Active)
            .collect();
        
        let total_count = active_listings.len() as u64;
        
        let paginated_listings = active_listings
            .into_iter()
            .skip(start_idx)
            .take(limit_val)
            .collect();
        
        PaginatedListings {
            listings: paginated_listings,
            total_count,
            has_more: (start_idx + limit_val) < total_count as usize,
        }
    })
}

#[query]
fn get_listings_by_collection(collection_id: Principal, start: Option<u64>, limit: Option<u64>) -> PaginatedListings {
    let start_idx = start.unwrap_or(0) as usize;
    let limit_val = limit.unwrap_or(100).min(100) as usize;
    
    let listing_ids = crate::state::get_listings_by_collection(&collection_id);
    
    LISTINGS.with(|listings| {
        let map = listings.borrow();
        let collection_listings: Vec<ListingInfo> = listing_ids.iter()
            .filter_map(|id| map.get(id))
            .filter(|listing| listing.status == ListingStatus::Active)
            .collect();
        
        let total_count = collection_listings.len() as u64;
        
        let paginated_listings = collection_listings
            .into_iter()
            .skip(start_idx)
            .take(limit_val)
            .collect();
        
        PaginatedListings {
            listings: paginated_listings,
            total_count,
            has_more: (start_idx + limit_val) < total_count as usize,
        }
    })
}

#[query]
fn get_listings_by_seller(seller: Principal, start: Option<u64>, limit: Option<u64>) -> PaginatedListings {
    let start_idx = start.unwrap_or(0) as usize;
    let limit_val = limit.unwrap_or(100).min(100) as usize;
    
    LISTINGS.with(|listings| {
        let seller_listings: Vec<ListingInfo> = listings.borrow()
            .iter()
            .map(|entry| entry.value())
            .filter(|listing| listing.seller == seller)
            .collect();
        
        let total_count = seller_listings.len() as u64;
        
        let paginated_listings = seller_listings
            .into_iter()
            .skip(start_idx)
            .take(limit_val)
            .collect();
        
        PaginatedListings {
            listings: paginated_listings,
            total_count,
            has_more: (start_idx + limit_val) < total_count as usize,
        }
    })
}

#[query]
fn get_sales_history(start: Option<u64>, limit: Option<u64>) -> Vec<SaleInfo> {
    let start_idx = start.unwrap_or(0) as usize;
    let limit_val = limit.unwrap_or(100).min(100) as usize;
    
    SALES.with(|sales| {
        sales.borrow()
            .iter()
            .map(|entry| entry.value())
            .skip(start_idx)
            .take(limit_val)
            .collect()
    })
}