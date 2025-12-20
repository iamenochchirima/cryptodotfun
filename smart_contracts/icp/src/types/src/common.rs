use candid::CandidType;
use serde::{Deserialize, Serialize};

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct PaginationArgs {
    pub offset: u64,
    pub limit: u64,
}
