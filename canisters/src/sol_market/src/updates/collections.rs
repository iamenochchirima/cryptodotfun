use ic_cdk::api::time;
use ic_cdk_macros::update;
use ic_cdk::caller;
use canister_uuid::uuid::get_uuid;

use types::solana::{
    CreateCollectionArgs, CreateCollectionResponse, SolanaCollection,
    UpdateCollectionStatusArgs, UpdateCollectionArgs, DeploymentStatus,
};
use crate::state::{
    add_collection, get_collection, update_collection as state_update_collection,
    delete_collection as state_delete_collection, increment_total_collections,
    name_exists, collection_exists,
};

#[update]
pub async fn create_collection(args: CreateCollectionArgs) -> Result<CreateCollectionResponse, String> {
    let owner = caller();

    if args.name.is_empty() {
        return Err("Collection name cannot be empty".to_string());
    }

    if args.symbol.is_empty() {
        return Err("Collection symbol cannot be empty".to_string());
    }

    if args.symbol.len() > 10 {
        return Err("Collection symbol must be 10 characters or less".to_string());
    }

    if args.supply == 0 {
        return Err("Supply must be greater than 0".to_string());
    }

    if args.royalty_bps > 10000 {
        return Err("Royalty basis points must be between 0 and 10000".to_string());
    }

    if name_exists(&args.name) {
        return Err("Collection name already exists".to_string());
    }

    let collection_id = get_uuid().await;
    let created_at = time();

    let collection = SolanaCollection {
        id: collection_id.clone(),
        owner,
        name: args.name,
        symbol: args.symbol,
        description: args.description,
        image_url: args.image_url,
        arweave_base_uri: None,
        solana_address: None,
        supply: args.supply,
        mint_price: args.mint_price,
        royalty_bps: args.royalty_bps,
        deployment_status: DeploymentStatus::Draft,
        created_at,
        deployed_at: None,
        metadata: args.metadata,
    };

    // Save collection
    add_collection(collection_id.clone(), collection);
    increment_total_collections();

    Ok(CreateCollectionResponse {
        collection_id,
        created_at,
    })
}

/// Update collection deployment status (called by frontend after uploading/deploying)
#[update]
pub fn update_collection_status(args: UpdateCollectionStatusArgs) -> Result<(), String> {
    let caller_principal = caller();

    // Get existing collection
    let mut collection = get_collection(&args.collection_id)
        .ok_or("Collection not found".to_string())?;

    // Verify ownership
    if collection.owner != caller_principal {
        return Err("Only the collection owner can update status".to_string());
    }

    // Update status
    collection.deployment_status = args.status.clone();

    // Update Arweave URI if provided
    if let Some(uri) = args.arweave_base_uri {
        collection.arweave_base_uri = Some(uri);
    }

    // Update Solana address if provided
    if let Some(address) = args.solana_address {
        collection.solana_address = Some(address);
    }

    // Set deployed_at timestamp if status is Deployed
    if matches!(args.status, DeploymentStatus::Deployed) {
        collection.deployed_at = Some(time());
    }

    // Save updated collection
    state_update_collection(&args.collection_id, collection)?;

    Ok(())
}

/// Update collection metadata (only for Draft status)
#[update]
pub fn update_collection(args: UpdateCollectionArgs) -> Result<(), String> {
    let caller_principal = caller();

    // Get existing collection
    let mut collection = get_collection(&args.collection_id)
        .ok_or("Collection not found".to_string())?;

    // Verify ownership
    if collection.owner != caller_principal {
        return Err("Only the collection owner can update the collection".to_string());
    }

    // Only allow updates for Draft status
    if !matches!(collection.deployment_status, DeploymentStatus::Draft) {
        return Err("Can only update collections in Draft status".to_string());
    }

    // Update fields if provided
    if let Some(description) = args.description {
        collection.description = Some(description);
    }

    if let Some(image_url) = args.image_url {
        collection.image_url = Some(image_url);
    }

    if let Some(metadata) = args.metadata {
        collection.metadata = metadata;
    }

    // Save updated collection
    state_update_collection(&args.collection_id, collection)?;

    Ok(())
}

/// Delete a collection (only if in Draft status)
#[update]
pub fn delete_collection(collection_id: String) -> Result<(), String> {
    let caller_principal = caller();

    // Get existing collection
    let collection = get_collection(&collection_id)
        .ok_or("Collection not found".to_string())?;

    // Verify ownership
    if collection.owner != caller_principal {
        return Err("Only the collection owner can delete the collection".to_string());
    }

    // Only allow deletion for Draft status
    if !matches!(collection.deployment_status, DeploymentStatus::Draft) {
        return Err("Can only delete collections in Draft status".to_string());
    }

    // Delete collection
    state_delete_collection(&collection_id)?;

    Ok(())
}
