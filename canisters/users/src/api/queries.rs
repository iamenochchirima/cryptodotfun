use ic_cdk::query;

use crate::{common::types::user::User, USERS};


#[query]
pub fn get_user() -> Result<User, String> {
    let caller = ic_cdk::caller();
    let user = USERS.with(|s| s.borrow().get(&caller));
    match user {
        Some(record) => Ok(record.clone()),
        None => Err("Record not found".to_string()),
    }
}

#[query]
pub fn get_users() -> Vec<User> {
    USERS.with(|s|
        s
            .borrow()
            .iter()
            .map(|(_, v)| v.clone())
            .collect::<Vec<User>>()
    )
}
