use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "draft_status", rename_all = "lowercase")]
pub enum DraftStatus {
    Draft,
    Uploading,
    Deployed,
}

impl std::fmt::Display for DraftStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            DraftStatus::Draft => write!(f, "draft"),
            DraftStatus::Uploading => write!(f, "uploading"),
            DraftStatus::Deployed => write!(f, "deployed"),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct CollectionDraft {
    pub id: Uuid,
    pub user_id: String,
    pub blockchain: String,
    pub nft_standard: Option<String>,
    pub name: String,
    pub symbol: String,
    pub description: Option<String>,
    pub supply: i32,
    pub mint_price: String,
    pub royalty_bps: i32,
    pub collection_image_url: Option<String>,
    pub metadata: serde_json::Value,
    pub status: DraftStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateDraftRequest {
    pub user_id: String,
    pub blockchain: String,
    pub nft_standard: Option<String>,
    pub name: String,
    pub symbol: String,
    pub description: Option<String>,
    pub supply: i32,
    pub mint_price: String,
    pub royalty_bps: i32,
    pub collection_image_url: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateDraftRequest {
    pub name: Option<String>,
    pub symbol: Option<String>,
    pub description: Option<String>,
    pub supply: Option<i32>,
    pub mint_price: Option<String>,
    pub royalty_bps: Option<i32>,
    pub collection_image_url: Option<String>,
    pub metadata: Option<serde_json::Value>,
    pub status: Option<DraftStatus>,
}
