use candid::{CandidType, Principal};
use serde::{ Deserialize, Serialize };


#[derive(CandidType, Clone, Serialize, Deserialize)]
pub struct User {
    pub principal: Principal,
    pub username: String,
    pub created_at: u64,
}

#[derive(CandidType, Clone, Serialize, Deserialize)]
pub struct AddUserArgs {
    pub username: String,
}

