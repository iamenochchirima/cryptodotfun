extern crate serde;
use candid::Principal;
use common::types::user::{
    User, AddUserArgs
};
use ic_stable_structures::memory_manager::{ MemoryId, MemoryManager, VirtualMemory };
use ic_stable_structures::{ DefaultMemoryImpl, StableBTreeMap };
use std::cell::RefCell;


pub mod api;
pub mod common;

type Memory = VirtualMemory<DefaultMemoryImpl>;

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> = RefCell::new(
        MemoryManager::init(DefaultMemoryImpl::default())
    );

    static USERS: RefCell<StableBTreeMap<Principal, User, Memory>> = RefCell::new(
        StableBTreeMap::init(MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(6))))
    );

}

ic_cdk::export_candid!();
