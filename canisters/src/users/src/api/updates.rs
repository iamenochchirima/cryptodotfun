use std::borrow::Cow;
use candid::{ Decode, Encode };
use ic_cdk::{ update };
use ic_cdk::api::{ time };
use ic_stable_structures::storable::Bound;
use ic_stable_structures::Storable;

use crate::common::types::user::{AddUserArgs, User };
use crate::{ USERS};

impl Storable for User {
    fn to_bytes(&self) -> std::borrow::Cow<[u8]> {
        Cow::Owned(Encode!(self).unwrap())
    }

    fn from_bytes(bytes: std::borrow::Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

#[update]
pub async fn add_user(args: AddUserArgs) -> Result<(), String> {
    let caller = ic_cdk::caller();
    ic_cdk::println!("add_user called by: {:?}", caller.to_text());
    let existing_user = USERS.with(|users| {
        users.borrow().get(&caller)
    });

    if existing_user.is_some() {
        return Err("User already exists".to_string());
    }

    let user = User {
        principal: caller,
        username: args.username,
        created_at: time(),
    };

    USERS.with(|users| {
        users.borrow_mut().insert(caller, user);
    });
    Ok(())
}

