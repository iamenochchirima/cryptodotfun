use candid::{CandidType, Principal};
use serde::{ Deserialize, Serialize };


#[derive(CandidType, Clone, Serialize, Deserialize)]
pub struct User {
    pub principal: Principal,
    pub username: String,
    pub email: Option<String>,
    pub referral_source: Option<String>,
    pub referral_code: Option<String>,
    pub interests: Vec<String>,
    pub created_at: u64,
}

#[derive(CandidType, Clone, Serialize, Deserialize)]
pub struct AddUserArgs {
    pub username: String,
    pub email: Option<String>,
    pub referral_source: Option<String>,
    pub referral_code: Option<String>,
    pub interests: Vec<String>,
}

