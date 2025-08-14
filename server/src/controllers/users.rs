use actix_web::{HttpResponse, Result};
use crate::ic_agent::{get_backend_actor};

pub async fn test_connection() -> Result<HttpResponse> {
    let actor = get_backend_actor().await;
    
    Ok(HttpResponse::Ok().json(serde_json::json!({
        "success": true,
        "message": "IC Backend Actor is connected",
        "network": actor.config.network,
        "host": actor.config.ic_host,
        "canister_id": actor.config.identity_provider_canister_id,
        "principal": actor.get_principal().to_text()
    })))
}
