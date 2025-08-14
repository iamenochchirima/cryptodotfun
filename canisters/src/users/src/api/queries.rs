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

#[query]
pub fn is_username_available(username: String) -> bool {
    USERS.with(|s| {
        s.borrow()
            .values()
            .all(|user| user.username != username)
    })
}

#[query]
pub fn is_email_in_use(email: String) -> bool {
    USERS.with(|s| {
        s.borrow()
            .values()
            .any(|user| {
                user.email
                    .as_ref()
                    .map_or(false, |user_email| user_email == &email)
            })
    })
}