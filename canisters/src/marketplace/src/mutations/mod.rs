use ic_cdk::api::msg_caller;
use ic_cdk::update;
use crate::types::*;
use crate::state;
use crate::solana::candy_machine;

#[update]
pub async fn create_collection(args: CreateCollectionArgs) -> Result<String, String> {
    let caller = msg_caller();
   return state::add_collection(args, caller).await;
}

#[update]
pub async fn create_listing(args: CreateListingArgs, blockchain: Blockchain) -> Result<String, String> {
    let caller = msg_caller();
    state::add_listing(args, caller, blockchain).await
}

#[update]
pub fn update_listing(args: UpdateListingArgs, collection_id: String) -> Result<(), String> {
    state::update_listing(args, &collection_id)
}

#[update]
pub fn cancel_listing(collection_id: String, listing_id: String) -> Result<(), String> {
    let caller = msg_caller();

    if let Some(listing) = state::get_listing(&collection_id, &listing_id) {
        if listing.seller != caller {
            return Err("Not authorized".to_string());
        }

        state::update_listing(
            UpdateListingArgs {
                listing_id: listing_id.clone(),
                price: None,
                status: Some(ListingStatus::Cancelled),
            },
            &collection_id,
        )
    } else {
        Err("Listing not found".to_string())
    }
}

#[update]
pub fn update_collection_status(args: UpdateCollectionStatusArgs) -> Result<(), String> {
    let caller = msg_caller();

    if let Some(collection) = state::get_collection(&args.collection_id) {
        if collection.creator != caller {
            return Err("Not authorized".to_string());
        }
        state::update_collection_status(args)
    } else {
        Err("Collection not found".to_string())
    }
}

#[update]
pub fn update_solana_stage(args: UpdateSolanaStageArgs) -> Result<(), String> {
    let caller = msg_caller();

    if let Some(collection) = state::get_collection(&args.collection_id) {
        if collection.creator != caller {
            return Err("Not authorized".to_string());
        }
        state::update_solana_stage(args)
    } else {
        Err("Collection not found".to_string())
    }
}

#[update]
pub async fn deploy_candy_machine(
    collection_id: String,
    user_wallet_address: String,
) -> Result<String, String> {
    let caller = msg_caller();

    let collection = state::get_collection(&collection_id)
        .ok_or("Collection not found")?;

    if collection.creator != caller {
        return Err("Not authorized".to_string());
    }

    let candy_machine_address = candy_machine::deploy_candy_machine_for_user(
        collection_id.clone(),
        user_wallet_address.clone(),
    ).await?;

    state::update_solana_stage(UpdateSolanaStageArgs {
        collection_id,
        stage: SolanaDeploymentStage::Deployed,
        candy_machine_address: Some(candy_machine_address.clone()),
        candy_machine_authority: Some(user_wallet_address),
        collection_mint: None,
        manifest_url: None,
        candy_machine_config: None,
        files_uploaded: None,
        metadata_created: None,
    })?;

    Ok(candy_machine_address)
}
