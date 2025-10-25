use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap, StableCell, Storable};
use std::borrow::Cow;
use ic_stable_structures::storable::Bound;
use std::cell::RefCell;
use candid::{Principal, Nat};

use types::icp::{CollectionInfo, ListingInfo, SaleInfo, MarketplaceConfig, MarketplaceEvent};

type Memory = VirtualMemory<DefaultMemoryImpl>;

// Implement Storable for CollectionInfo

// Implement Storable for ListingInfo

// Implement Storable for SaleInfo

// Implement Storable for MarketplaceConfig

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );

    pub static MARKETPLACE_CONFIG: RefCell<StableCell<MarketplaceConfig, Memory>> = RefCell::new(
        StableCell::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0))), 
            MarketplaceConfig {
                collection_creation_fee: Nat::from(100_000_000u64),
                marketplace_fee_percentage: 250,
                max_listing_duration: 30 * 24 * 60 * 60 * 1_000_000_000u64,
                min_listing_price: Nat::from(100_000u64),
                supported_tokens: vec![Principal::from_text("rrkah-fqaaa-aaaaa-aaaaq-cai").unwrap()],
                admin: Principal::anonymous(),
            }
        )
    );

    pub static ADMIN: RefCell<StableCell<Principal, Memory>> = RefCell::new(
        StableCell::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1))), 
            Principal::anonymous()
        )
    );

    pub static TOTAL_COLLECTIONS_CREATED: RefCell<StableCell<u64, Memory>> = RefCell::new(
        StableCell::init(MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2))), 0u64)
    );

    pub static TOTAL_VOLUME_TRADED: RefCell<StableCell<u128, Memory>> = RefCell::new(
        StableCell::init(MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(3))), 0u128)
    );

    pub static NEXT_LISTING_ID: RefCell<StableCell<u64, Memory>> = RefCell::new(
        StableCell::init(MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(4))), 1u64)
    );

    pub static COLLECTIONS: RefCell<StableBTreeMap<Principal, CollectionInfo, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(5))))
    );

    pub static COLLECTIONS_BY_NAME: RefCell<StableBTreeMap<String, Principal, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(6))))
    );

    pub static LISTINGS: RefCell<StableBTreeMap<u64, ListingInfo, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(7))))
    );

    pub static SALES: RefCell<StableBTreeMap<u64, SaleInfo, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(8))))
    );

    pub static COLLECTIONS_BY_CREATOR: RefCell<StableBTreeMap<Principal, Vec<u8>, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(9))))
    );

    pub static LISTINGS_BY_COLLECTION: RefCell<StableBTreeMap<Principal, Vec<u8>, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(10))))
    );

    pub static USER_COLLECTIONS: RefCell<std::collections::HashMap<Principal, Vec<Principal>>> = RefCell::new(
        std::collections::HashMap::new()
    );

    pub static NEXT_TRANSACTION_ID: RefCell<StableCell<u64, Memory>> = RefCell::new(
        StableCell::init(MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(12))), 1u64)
    );

    pub static MARKETPLACE_EVENTS: RefCell<Vec<MarketplaceEvent>> = RefCell::new(Vec::new());
}

pub fn init_marketplace(admin: Principal, fee: Nat, fee_percentage: u16) {
    ADMIN.with(|a| a.borrow_mut().set(admin));
    MARKETPLACE_CONFIG.with(|c| {
        let mut config = c.borrow().get().clone();
        config.collection_creation_fee = fee;
        config.marketplace_fee_percentage = fee_percentage;
        config.admin = admin;
        c.borrow_mut().set(config);
    });
}

pub fn get_next_listing_id() -> u64 {
    NEXT_LISTING_ID.with(|id| {
        let current = id.borrow().get().clone();
        id.borrow_mut().set(current + 1);
        current
    })
}

pub fn increment_total_collections() {
    TOTAL_COLLECTIONS_CREATED.with(|count| {
        let current = count.borrow().get().clone();
        count.borrow_mut().set(current + 1);
    });
}

pub fn add_to_total_volume(amount: u128) {
    TOTAL_VOLUME_TRADED.with(|volume| {
        let current = volume.borrow().get().clone();
        volume.borrow_mut().set(current + amount);
    });
}

pub fn get_collections_by_creator(creator: &Principal) -> Vec<Principal> {
    COLLECTIONS_BY_CREATOR.with(|map| {
        map.borrow()
            .get(creator)
            .and_then(|bytes| candid::decode_one::<Vec<Principal>>(&bytes).ok())
            .unwrap_or_default()
    })
}

pub fn add_collection_to_creator(creator: Principal, collection_id: Principal) {
    COLLECTIONS_BY_CREATOR.with(|map| {
        let mut collections = map.borrow()
            .get(&creator)
            .and_then(|bytes| candid::decode_one::<Vec<Principal>>(&bytes).ok())
            .unwrap_or_default();
        
        collections.push(collection_id);
        
        let encoded = candid::encode_one(&collections).unwrap();
        map.borrow_mut().insert(creator, encoded);
    });
}

pub fn get_listings_by_collection(collection: &Principal) -> Vec<u64> {
    LISTINGS_BY_COLLECTION.with(|map| {
        map.borrow()
            .get(collection)
            .and_then(|bytes| candid::decode_one::<Vec<u64>>(&bytes).ok())
            .unwrap_or_default()
    })
}

pub fn add_listing_to_collection(collection: Principal, listing_id: u64) {
    LISTINGS_BY_COLLECTION.with(|map| {
        let mut listings = map.borrow()
            .get(&collection)
            .and_then(|bytes| candid::decode_one::<Vec<u64>>(&bytes).ok())
            .unwrap_or_default();

        listings.push(listing_id);

        let encoded = candid::encode_one(&listings).unwrap();
        map.borrow_mut().insert(collection, encoded);
    });
}

pub fn get_next_transaction_id() -> u64 {
    NEXT_TRANSACTION_ID.with(|id| {
        let current = id.borrow().get().clone();
        id.borrow_mut().set(current + 1);
        current
    })
}