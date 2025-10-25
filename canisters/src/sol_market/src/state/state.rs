use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap, StableCell, Storable};
use std::borrow::Cow;
use ic_stable_structures::storable::Bound;
use std::cell::RefCell;
use candid::Principal;

use types::solana::{SolanaCollection, DeploymentStatus};

type Memory = VirtualMemory<DefaultMemoryImpl>;

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );

    pub static ADMIN: RefCell<StableCell<Principal, Memory>> = RefCell::new(
        StableCell::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0))),
            Principal::anonymous()
        )
    );

    pub static TOTAL_COLLECTIONS: RefCell<StableCell<u64, Memory>> = RefCell::new(
        StableCell::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1))),
            0u64
        )
    );

    pub static COLLECTIONS: RefCell<StableBTreeMap<String, SolanaCollection, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2)))
        )
    );

    pub static COLLECTIONS_BY_OWNER: RefCell<StableBTreeMap<Principal, Vec<u8>, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(3)))
        )
    );

    pub static COLLECTIONS_BY_NAME: RefCell<StableBTreeMap<String, String, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(4)))
        )
    );
}


pub fn init_marketplace(admin: Principal) {
    ADMIN.with(|a| {
        let _ = a.borrow_mut().set(admin);
    });
}

pub fn get_admin() -> Principal {
    ADMIN.with(|a| a.borrow().get().clone())
}

pub fn increment_total_collections() -> u64 {
    TOTAL_COLLECTIONS.with(|count| {
        let current = count.borrow().get().clone();
        let new_count = current + 1;
        let _ = count.borrow_mut().set(new_count);
        new_count
    })
}

pub fn get_total_collections() -> u64 {
    TOTAL_COLLECTIONS.with(|count| count.borrow().get().clone())
}


pub fn add_collection(id: String, collection: SolanaCollection) {
    COLLECTIONS.with(|c| {
        c.borrow_mut().insert(id.clone(), collection.clone());
    });

    COLLECTIONS_BY_NAME.with(|map| {
        map.borrow_mut().insert(collection.name.clone(), id.clone());
    });

    add_collection_to_owner(collection.owner, id);
}

pub fn get_collection(id: &String) -> Option<SolanaCollection> {
    COLLECTIONS.with(|c| c.borrow().get(id))
}

pub fn update_collection(id: &String, collection: SolanaCollection) -> Result<(), String> {
    COLLECTIONS.with(|c| {
        if c.borrow().contains_key(id) {
            c.borrow_mut().insert(id.clone(), collection);
            Ok(())
        } else {
            Err("Collection not found".to_string())
        }
    })
}

pub fn delete_collection(id: &String) -> Result<(), String> {
    COLLECTIONS.with(|c| {
        if let Some(collection) = c.borrow_mut().remove(id) {
            COLLECTIONS_BY_NAME.with(|map| {
                map.borrow_mut().remove(&collection.name);
            });

            remove_collection_from_owner(&collection.owner, id);

            Ok(())
        } else {
            Err("Collection not found".to_string())
        }
    })
}

pub fn collection_exists(id: &String) -> bool {
    COLLECTIONS.with(|c| c.borrow().contains_key(id))
}

pub fn name_exists(name: &String) -> bool {
    COLLECTIONS_BY_NAME.with(|map| map.borrow().contains_key(name))
}

pub fn get_collections_by_owner(owner: &Principal) -> Vec<String> {
    COLLECTIONS_BY_OWNER.with(|map| {
        map.borrow()
            .get(owner)
            .and_then(|bytes| candid::decode_one::<Vec<String>>(&bytes).ok())
            .unwrap_or_default()
    })
}

pub fn add_collection_to_owner(owner: Principal, collection_id: String) {
    COLLECTIONS_BY_OWNER.with(|map| {
        let mut collections = map.borrow()
            .get(&owner)
            .and_then(|bytes| candid::decode_one::<Vec<String>>(&bytes).ok())
            .unwrap_or_default();

        if !collections.contains(&collection_id) {
            collections.push(collection_id);
            let encoded = candid::encode_one(&collections).unwrap();
            map.borrow_mut().insert(owner, encoded);
        }
    });
}

pub fn remove_collection_from_owner(owner: &Principal, collection_id: &String) {
    COLLECTIONS_BY_OWNER.with(|map| {
        if let Some(bytes) = map.borrow().get(owner) {
            if let Ok(mut collections) = candid::decode_one::<Vec<String>>(&bytes) {
                collections.retain(|id| id != collection_id);
                let encoded = candid::encode_one(&collections).unwrap();
                map.borrow_mut().insert(owner.clone(), encoded);
            }
        }
    });
}


pub fn count_collections_by_status(status: &DeploymentStatus) -> u64 {
    COLLECTIONS.with(|c| {
        c.borrow()
            .iter()
            .filter(|entry| &entry.value().deployment_status == status)
            .count() as u64
    })
}

pub fn count_unique_creators() -> u64 {
    COLLECTIONS_BY_OWNER.with(|map| {
        map.borrow().iter().count() as u64
    })
}


pub fn get_all_collection_ids() -> Vec<String> {
    COLLECTIONS.with(|c| {
        c.borrow()
            .iter()
            .map(|entry| entry.key().clone())
            .collect()
    })
}

pub fn get_collections_paginated(offset: u64, limit: u64) -> (Vec<SolanaCollection>, u64) {
    COLLECTIONS.with(|c| {
        let all: Vec<SolanaCollection> = c.borrow()
            .iter()
            .skip(offset as usize)
            .take(limit as usize)
            .map(|entry| entry.value().clone())
            .collect();

        let total = c.borrow().len();
        (all, total)
    })
}
