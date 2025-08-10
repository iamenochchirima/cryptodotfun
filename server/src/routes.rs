use actix_web::web::{self, ServiceConfig};
use crate::controllers::{
    // Health endpoints
    health_check, api_info,
    // Auth endpoints
    auth::{initiate_auth, verify_auth, auth_status, logout},
    // Protected endpoints
    protected::{protected_endpoint, user_profile},
    // User endpoints (IC-powered)
    users::{check_username, create_new_user, get_principal, test_connection},
};

/// Configure all application routes
pub fn configure_routes(cfg: &mut ServiceConfig) {
    cfg
        .route("/", web::get().to(api_info))
        
        .route("/health", web::get().to(health_check))
        
        .service(
            web::scope("/api/auth")
                .route("/initiate", web::post().to(initiate_auth))
                .route("/verify", web::get().to(verify_auth))
                .route("/status", web::get().to(auth_status))
                .route("/logout", web::post().to(logout))
        )
        
        .service(
            web::scope("/api/protected")
                .route("/test", web::get().to(protected_endpoint))
                .route("/profile", web::get().to(user_profile))
        )
        
        .service(
            web::scope("/api/users")
                .route("/check-username", web::post().to(check_username))
                .route("/create", web::post().to(create_new_user))
                .route("/principal", web::get().to(get_principal))
        )
        
        .service(
            web::scope("/api/ic")
                .route("/test", web::get().to(test_connection))
        );
}
