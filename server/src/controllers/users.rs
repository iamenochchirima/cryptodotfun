use actix_web::{web, HttpResponse, Result};
use serde::{Deserialize, Serialize};
use crate::ic_agent::{get_backend_actor, check_username_availability, create_user, UserData};
use candid::Principal;

#[derive(Deserialize)]
pub struct CheckUsernameRequest {
    pub username: String,
}

#[derive(Serialize)]
pub struct CheckUsernameResponse {
    pub available: bool,
    pub message: String,
}

#[derive(Deserialize)]
pub struct CreateUserRequest {
    pub username: String,
    pub email: Option<String>,
}

#[derive(Serialize)]
pub struct CreateUserResponse {
    pub success: bool,
    pub user_id: Option<String>,
    pub message: String,
}

#[derive(Serialize)]
pub struct GetUserResponse {
    pub success: bool,
    pub user: Option<UserData>,
    pub message: String,
}

/// Check if a username is available
pub async fn check_username(req: web::Json<CheckUsernameRequest>) -> Result<HttpResponse> {
    match check_username_availability(&req.username).await {
        Ok(available) => {
            let response = CheckUsernameResponse {
                available,
                message: if available {
                    "Username is available".to_string()
                } else {
                    "Username is already taken".to_string()
                }
            };
            Ok(HttpResponse::Ok().json(response))
        },
        Err(e) => {
            let response = CheckUsernameResponse {
                available: false,
                message: format!("Error checking username: {}", e),
            };
            Ok(HttpResponse::InternalServerError().json(response))
        }
    }
}

/// Create a new user
pub async fn create_new_user(req: web::Json<CreateUserRequest>) -> Result<HttpResponse> {
    match create_user(&req.username, req.email.clone()).await {
        Ok(user_id) => {
            let response = CreateUserResponse {
                success: true,
                user_id: Some(user_id),
                message: "User created successfully".to_string(),
            };
            Ok(HttpResponse::Ok().json(response))
        },
        Err(e) => {
            let response = CreateUserResponse {
                success: false,
                user_id: None,
                message: format!("Error creating user: {}", e),
            };
            Ok(HttpResponse::InternalServerError().json(response))
        }
    }
}

/// Get current user's principal
pub async fn get_principal() -> Result<HttpResponse> {
    match get_backend_actor().await.get_principal() {
        principal if principal != Principal::anonymous() => {
            Ok(HttpResponse::Ok().json(serde_json::json!({
                "principal": principal.to_text(),
                "message": "Principal retrieved successfully"
            })))
        },
        _ => {
            Ok(HttpResponse::Ok().json(serde_json::json!({
                "principal": "anonymous",
                "message": "No authenticated principal"
            })))
        }
    }
}

/// Test the IC connection
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
