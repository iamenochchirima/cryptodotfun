use candid::Nat;
use ic_cdk_macros::update;
use num_traits::cast::ToPrimitive;
use crate::types::{ListNFTArgs, BuyNFTArgs, ListingInfo, ListingStatus, SaleInfo};
use crate::state::state::*;
use crate::errors::MarketplaceError;
use crate::utils::validation::validate_listing_args;
use crate::utils::nft::{verify_token_ownership, verify_marketplace_approval, transfer_nft};
use crate::utils::payments::{process_sale_payment, calculate_marketplace_fee};

#[update]
async fn list_nft(args: ListNFTArgs) -> Result<u64, MarketplaceError> {
    let caller = ic_cdk::api::msg_caller();
    let current_time = ic_cdk::api::time();
    
    validate_listing_args(&args)?;
    
    let collection_exists = COLLECTIONS.with(|collections| {
        collections.borrow().contains_key(&args.collection_id)
    });
    
    if !collection_exists {
        return Err(MarketplaceError::CollectionNotFound);
    }
    
    verify_token_ownership(args.collection_id, args.token_id.clone(), caller).await?;
    
    verify_marketplace_approval(args.collection_id, args.token_id.clone(), caller).await?;
    
    let expires_at = args.duration.map(|duration| current_time + duration);
    
    let listing_id = crate::state::get_next_listing_id();
    
    let listing_info = ListingInfo {
        token_id: args.token_id.clone(),
        collection_id: args.collection_id,
        seller: caller,
        price: args.price.clone(),
        created_at: current_time,
        expires_at,
        status: ListingStatus::Active,
    };
    
    // Store listing
    LISTINGS.with(|listings| {
        listings.borrow_mut().insert(listing_id, listing_info.clone());
    });
    
    crate::state::add_listing_to_collection(args.collection_id, listing_id);
    
    Ok(listing_id)
}

#[update]
async fn buy_nft(args: BuyNFTArgs) -> Result<(), MarketplaceError> {
    let caller = ic_cdk::api::msg_caller();
    let current_time = ic_cdk::api::time();
    
    let listing_info = LISTINGS.with(|listings| {
        listings.borrow().get(&args.listing_id)
    }).ok_or(MarketplaceError::ListingNotFound)?;
    
    if listing_info.status != ListingStatus::Active {
        return Err(MarketplaceError::ListingNotActive);
    }
    
    if let Some(expires_at) = listing_info.expires_at {
        if current_time > expires_at {
            LISTINGS.with(|listings| {
                if let Some(mut listing) = listings.borrow_mut().get(&args.listing_id) {
                    listing.status = ListingStatus::Expired;
                    listings.borrow_mut().insert(args.listing_id, listing);
                }
            });
            return Err(MarketplaceError::ListingExpired);
        }
    }

    if caller == listing_info.seller {
        return Err(MarketplaceError::CannotBuyOwnListing);
    }
    
    // Calculate marketplace fee
    let marketplace_fee_percentage = MARKETPLACE_CONFIG.with(|config| {
        config.borrow().get().marketplace_fee_percentage
    });
    
    let marketplace_fee = calculate_marketplace_fee(&listing_info.price, marketplace_fee_percentage);
    let seller_amount = listing_info.price.clone() - marketplace_fee.clone();
    
    process_sale_payment(caller, listing_info.seller, seller_amount, marketplace_fee.clone()).await?;
    
    transfer_nft(
        listing_info.collection_id,
        listing_info.token_id.clone(),
        listing_info.seller,
        caller,
    ).await?;
    
    // Update listing status
    LISTINGS.with(|listings| {
        if let Some(mut listing) = listings.borrow_mut().get(&args.listing_id) {
            listing.status = ListingStatus::Sold;
            listings.borrow_mut().insert(args.listing_id, listing);
        }
    });
    
    let sale_info = SaleInfo {
        listing_id: args.listing_id,
        token_id: listing_info.token_id.clone(),
        collection_id: listing_info.collection_id,
        seller: listing_info.seller,
        buyer: caller,
        price: listing_info.price.clone(),
        marketplace_fee: marketplace_fee.clone(),
        sale_time: current_time,
        transaction_hash: format!("{}_{}", args.listing_id, current_time),
    };
    
    SALES.with(|sales| {
        sales.borrow_mut().insert(args.listing_id, sale_info);
    });
    
    COLLECTIONS.with(|collections| {
        if let Some(mut collection) = collections.borrow_mut().get(&listing_info.collection_id) {
            let price_u128: u128 = listing_info.price.0.to_u128().unwrap_or(0);
            let current_volume_u128: u128 = collection.total_volume.0.to_u128().unwrap_or(0);
            collection.total_volume = Nat::from(current_volume_u128 + price_u128);
            
  
            match &collection.floor_price {
                None => collection.floor_price = Some(listing_info.price.clone()),
                Some(current_floor) => {
                    if listing_info.price < *current_floor {
                        collection.floor_price = Some(listing_info.price.clone());
                    }
                }
            }
            
            collections.borrow_mut().insert(listing_info.collection_id, collection);
        }
    });
    
    let price_u128: u128 = listing_info.price.0.to_u128().unwrap_or(0);
    crate::state::add_to_total_volume(price_u128);
    
    Ok(())
}

#[update]
async fn cancel_listing(listing_id: u64) -> Result<(), MarketplaceError> {
    let caller = ic_cdk::api::msg_caller();
    
    let listing_info = LISTINGS.with(|listings| {
        listings.borrow().get(&listing_id)
    }).ok_or(MarketplaceError::ListingNotFound)?;
    
    if caller != listing_info.seller {
        return Err(MarketplaceError::NotAuthorized);
    }
    
    if listing_info.status != ListingStatus::Active {
        return Err(MarketplaceError::ListingAlreadyCancelled);
    }

    LISTINGS.with(|listings| {
        if let Some(mut listing) = listings.borrow_mut().get(&listing_id) {
            listing.status = ListingStatus::Cancelled;
            listings.borrow_mut().insert(listing_id, listing);
        }
    });
    
    Ok(())
}