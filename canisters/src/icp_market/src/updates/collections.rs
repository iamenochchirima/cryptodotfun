use candid::{ Nat };
use ic_cdk::update;
use types::icp::{
    IcpCreateCollectionArgs,
    IcpCreateCollectionResponse,
    CollectionInfo,
    CollectionStatus,
};
use crate::state::state::*;
use ic_cdk::println;
use crate::errors::MarketplaceError;
use crate::utils::validation::validate_collection_args;
use crate::utils::payments::process_icp_fee_payment;
use crate::utils::canister_management::{deploy_nft_collection, NFTCollectionInitArgs};

#[update]
async fn create_collection(
    args: IcpCreateCollectionArgs
) -> Result<IcpCreateCollectionResponse, MarketplaceError> {
    let caller = ic_cdk::api::msg_caller();
    let current_time = ic_cdk::api::time();

    validate_collection_args(&args)?;

    if COLLECTIONS_BY_NAME.with(|names| names.borrow().contains_key(&args.collection_name)) {
        return Err(MarketplaceError::CollectionNameAlreadyExists);
    }

    let fee_amount = MARKETPLACE_CONFIG.with(|config| {
        config.borrow().get().collection_creation_fee.clone()
    });

    if fee_amount > Nat::from(0u64) {
        process_icp_fee_payment(caller, fee_amount).await?;
    }

    let nft_init_args = NFTCollectionInitArgs {
        name: args.collection_name.clone(),
        symbol: args.collection_symbol.clone(),
        description: args.description.clone(),
        logo: args.logo.clone(),
        supply_cap: args.supply_cap.clone(),
        owner: caller,
    };

    let collection_canister_id = deploy_nft_collection(caller, nft_init_args)
        .await
        .map_err(|e| MarketplaceError::CanisterCreationFailed(e))?;

    let collection_info = CollectionInfo {
        id: collection_canister_id,
        creator: caller,
        name: args.collection_name.clone(),
        symbol: args.collection_symbol.clone(),
        description: args.description.clone(),
        logo: args.logo.clone(),
        supply_cap: args.supply_cap.clone(),
        created_at: current_time,
        status: CollectionStatus::AssetsPending,
        total_supply: Nat::from(0u64),
        floor_price: None,
        total_volume: Nat::from(0u64),
    };

    println!("Collection created: {:?}", collection_info);

    COLLECTIONS.with(|collections| {
        collections.borrow_mut().insert(collection_canister_id, collection_info.clone());
    });

    COLLECTIONS_BY_NAME.with(|names| {
        names.borrow_mut().insert(args.collection_name.clone(), collection_canister_id);
    });

    add_collection_to_creator(caller, collection_canister_id);
    increment_total_collections();

    Ok(IcpCreateCollectionResponse {
        collection_canister_id,
        transaction_id: current_time,
    })
}