use candid::CandidType;
use serde::{Deserialize, Serialize};

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub enum MarketplaceError {
    // Collection creation errors
    CollectionNameAlreadyExists,
    InvalidCollectionName,
    InvalidCollectionSymbol,
    InvalidDescription,
    InvalidLogoUrl,
    
    // Payment errors
    PaymentFailed(String),
    InsufficientFunds,
    
    // Canister management errors
    CanisterCreationFailed(String),
    CanisterInstallationFailed(String),
    
    // General errors
    NotAuthorized,
    CollectionNotFound,
    InvalidInput(String),
    EncodingError(String),
    SystemError(String),
    
    // Listing errors
    TokenNotFound,
    TokenNotOwned,
    ListingNotFound,
    ListingExpired,
    ListingAlreadyCancelled,
    InvalidPrice,
    InvalidDuration,
    
    // Sale errors
    InsufficientApproval,
    TransferFailed(String),
    ListingNotActive,
    CannotBuyOwnListing,
    
    // Config errors
    InvalidFeePercentage,
}