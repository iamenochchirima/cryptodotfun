use ic_stable_structures::StableBTreeMap;
use std::cell::RefCell;
use crate::types::{Collection, CreateCollectionArgs, Blockchain};
use super::memory::{get_memory, COLLECTIONS_MEMORY_ID};
use candid::Principal;

thread_local! {
    static COLLECTIONS: RefCell<StableBTreeMap<String, Collection, super::memory::Memory>> =
        RefCell::new(StableBTreeMap::init(get_memory(COLLECTIONS_MEMORY_ID)));
}

pub fn add_collection(args: CreateCollectionArgs, creator: Principal) -> Result<String, String> {
    let collection_id = generate_collection_id(&args.blockchain, &args.name);

    let collection = Collection {
        id: collection_id.clone(),
        blockchain: args.blockchain,
        creator,
        name: args.name,
        symbol: args.symbol,
        description: args.description,
        image_url: args.image_url,
        banner_url: args.banner_url,
        contract_address: None,
        total_supply: args.total_supply,
        floor_price: 0,
        total_volume: 0,
        owner_count: 0,
        listed_count: 0,
        royalty_bps: args.royalty_bps,
        metadata: args.metadata,
        created_at: ic_cdk::api::time(),
        updated_at: ic_cdk::api::time(),
    };

    COLLECTIONS.with(|c| {
        c.borrow_mut().insert(collection_id.clone(), collection);
    });

    Ok(collection_id)
}

pub fn get_collection(collection_id: &str) -> Option<Collection> {
    COLLECTIONS.with(|c| c.borrow().get(collection_id))
}

pub fn get_all_collections(page: u32, limit: u32) -> Vec<Collection> {
    COLLECTIONS.with(|c| {
        c.borrow()
            .iter()
            .skip((page * limit) as usize)
            .take(limit as usize)
            .map(|(_, collection)| collection)
            .collect()
    })
}

pub fn get_collections_by_blockchain(blockchain: &Blockchain, page: u32, limit: u32) -> Vec<Collection> {
    COLLECTIONS.with(|c| {
        c.borrow()
            .iter()
            .filter(|(_, collection)| &collection.blockchain == blockchain)
            .skip((page * limit) as usize)
            .take(limit as usize)
            .map(|(_, collection)| collection)
            .collect()
    })
}

pub fn update_collection_stats(
    collection_id: &str,
    floor_price: Option<u64>,
    total_volume: Option<u64>,
    owner_count: Option<u32>,
    listed_count: Option<u32>,
) -> Result<(), String> {
    COLLECTIONS.with(|c| {
        let mut collections = c.borrow_mut();

        if let Some(mut collection) = collections.get(collection_id) {
            if let Some(fp) = floor_price {
                collection.floor_price = fp;
            }
            if let Some(tv) = total_volume {
                collection.total_volume = tv;
            }
            if let Some(oc) = owner_count {
                collection.owner_count = oc;
            }
            if let Some(lc) = listed_count {
                collection.listed_count = lc;
            }
            collection.updated_at = ic_cdk::api::time();

            collections.insert(collection_id.to_string(), collection);
            Ok(())
        } else {
            Err("Collection not found".to_string())
        }
    })
}

fn generate_collection_id(blockchain: &Blockchain, name: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    let mut hasher = DefaultHasher::new();
    blockchain.as_str().hash(&mut hasher);
    name.hash(&mut hasher);
    ic_cdk::api::time().hash(&mut hasher);

    format!("{}_{:x}", blockchain.as_str(), hasher.finish())
}
