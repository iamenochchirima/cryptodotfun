use candid::Nat;
use types::icp::{IcpCreateCollectionArgs, ListNFTArgs};
use crate::errors::MarketplaceError;

pub fn validate_collection_args(args: &IcpCreateCollectionArgs) -> Result<(), MarketplaceError> {
    // Validate collection name
    if args.collection_name.is_empty() || args.collection_name.len() > 100 {
        return Err(MarketplaceError::InvalidCollectionName);
    }
    
    // Validate collection symbol
    if args.collection_symbol.is_empty() || args.collection_symbol.len() > 10 {
        return Err(MarketplaceError::InvalidCollectionSymbol);
    }
    
    // Validate description
    if let Some(ref description) = args.description {
        if description.len() > 1000 {
            return Err(MarketplaceError::InvalidDescription);
        }
    }
    
    // Validate logo URL
    if let Some(ref logo) = args.logo {
        if logo.len() > 500 {
            return Err(MarketplaceError::InvalidLogoUrl);
        }
    }
    
    Ok(())
}

pub fn validate_listing_args(args: &ListNFTArgs) -> Result<(), MarketplaceError> {
    // Validate price (must be greater than 0)
    if args.price == Nat::from(0u64) {
        return Err(MarketplaceError::InvalidPrice);
    }
    
    // Check minimum price (0.001 ICP = 100,000 e8s)
    let min_price = Nat::from(100_000u64);
    if args.price < min_price {
        return Err(MarketplaceError::InvalidPrice);
    }
    
    // Check duration if provided (max 30 days)
    if let Some(duration) = args.duration {
        let max_duration = 30 * 24 * 60 * 60 * 1_000_000_000u64; // 30 days in nanoseconds
        if duration > max_duration {
            return Err(MarketplaceError::InvalidDuration);
        }
    }
    
    Ok(())
}