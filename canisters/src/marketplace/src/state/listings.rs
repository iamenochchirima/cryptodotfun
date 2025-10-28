use ic_stable_structures::StableBTreeMap;
use std::cell::RefCell;
use crate::types::{Listing, CreateListingArgs, ListingStatus, UpdateListingArgs};
use super::memory::{get_memory, LISTINGS_MEMORY_ID};
use candid::Principal;

thread_local! {
    static LISTINGS: RefCell<StableBTreeMap<String, Listing, super::memory::Memory>> =
        RefCell::new(StableBTreeMap::init(get_memory(LISTINGS_MEMORY_ID)));
}

// Composite key format: "collection_id:listing_id"
fn make_listing_key(collection_id: &str, listing_id: &str) -> String {
    format!("{}:{}", collection_id, listing_id)
}

pub fn add_listing(args: CreateListingArgs, seller: Principal, blockchain: crate::types::Blockchain) -> Result<String, String> {
    let listing_id = generate_listing_id();
    let key = make_listing_key(&args.collection_id, &listing_id);

    let listing = Listing {
        id: listing_id.clone(),
        collection_id: args.collection_id.clone(),
        nft_id: args.nft_id,
        blockchain,
        seller,
        seller_address: args.seller_address,
        price: args.price,
        currency: args.currency,
        escrow_address: None,
        status: ListingStatus::Active,
        listed_at: ic_cdk::api::time(),
        expires_at: args.expires_at,
        updated_at: ic_cdk::api::time(),
        nft_metadata: args.nft_metadata,
    };

    LISTINGS.with(|l| {
        l.borrow_mut().insert(key, listing);
    });

    // Update collection listed count
    super::collections::update_collection_stats(&args.collection_id, None, None, None, None).ok();

    Ok(listing_id)
}

pub fn get_listing(collection_id: &str, listing_id: &str) -> Option<Listing> {
    let key = make_listing_key(collection_id, listing_id);
    LISTINGS.with(|l| l.borrow().get(&key))
}

pub fn get_collection_listings(
    collection_id: &str,
    page: u32,
    limit: u32,
    status: Option<ListingStatus>,
) -> Vec<Listing> {
    let prefix = format!("{}:", collection_id);

    LISTINGS.with(|l| {
        l.borrow()
            .range(prefix.clone()..)
            .take_while(|(key, _)| key.starts_with(&prefix))
            .filter(|(_, listing)| {
                status.as_ref().map_or(true, |s| &listing.status == s)
            })
            .skip((page * limit) as usize)
            .take(limit as usize)
            .map(|(_, listing)| listing)
            .collect()
    })
}

pub fn get_user_listings(seller: &Principal, page: u32, limit: u32) -> Vec<Listing> {
    LISTINGS.with(|l| {
        l.borrow()
            .iter()
            .filter(|(_, listing)| &listing.seller == seller)
            .skip((page * limit) as usize)
            .take(limit as usize)
            .map(|(_, listing)| listing)
            .collect()
    })
}

pub fn update_listing(args: UpdateListingArgs, collection_id: &str) -> Result<(), String> {
    let key = make_listing_key(collection_id, &args.listing_id);

    LISTINGS.with(|l| {
        let mut listings = l.borrow_mut();

        if let Some(mut listing) = listings.get(&key) {
            if let Some(price) = args.price {
                listing.price = price;
            }
            if let Some(status) = args.status {
                listing.status = status;
            }
            listing.updated_at = ic_cdk::api::time();

            listings.insert(key, listing);
            Ok(())
        } else {
            Err("Listing not found".to_string())
        }
    })
}

pub fn remove_listing(collection_id: &str, listing_id: &str) -> Result<(), String> {
    let key = make_listing_key(collection_id, listing_id);

    LISTINGS.with(|l| {
        l.borrow_mut().remove(&key);
    });

    Ok(())
}

pub fn get_collection_listing_count(collection_id: &str) -> u32 {
    let prefix = format!("{}:", collection_id);

    LISTINGS.with(|l| {
        l.borrow()
            .range(prefix.clone()..)
            .take_while(|(key, _)| key.starts_with(&prefix))
            .count() as u32
    })
}

fn generate_listing_id() -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    let mut hasher = DefaultHasher::new();
    ic_cdk::api::time().hash(&mut hasher);
    ic_cdk::caller().hash(&mut hasher);

    format!("listing_{:x}", hasher.finish())
}
