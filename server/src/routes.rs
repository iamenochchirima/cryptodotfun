use actix_web::web::{self, ServiceConfig};
use crate::controllers::{
    // Health endpoints
    health_check, api_info,
    // Auth endpoints
    initiate_auth, verify_auth, auth_status, logout,
};

/// Configure all application routes
pub fn configure_routes(cfg: &mut ServiceConfig) {
    cfg
        .route("/", web::get().to(api_info))
        
        .route("/health", web::get().to(health_check))
        
        .service(
            web::scope("/api/auth")
                .route("/initiate", web::post().to(initiate_auth))
                .route("/verify", web::post().to(verify_auth))
                .route("/status", web::get().to(auth_status))
                .route("/logout", web::post().to(logout))
        );
}
