use actix_web::{middleware::Logger, App, HttpServer};
use actix_cors::Cors;
use env_logger::Env;
use dotenv::dotenv;

mod controllers;
mod routes;
mod config;
mod redis;
mod ic_agent;
mod middleware;

use config::AppConfig;
use routes::configure_routes;
use redis::RedisClient;
use ic_agent::BackendActor;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    
    env_logger::init_from_env(Env::default().default_filter_or("info"));

    let config = AppConfig::from_env();

    // Initialize Redis client
    if let Err(e) = RedisClient::initialize_global().await {
        eprintln!("❌ Failed to connect to Redis: {}", e);
        eprintln!("🔄 Server will continue without Redis...");
        return Err(std::io::Error::new(
            std::io::ErrorKind::ConnectionRefused,
            format!("Redis connection failed: {}", e)
        ));
    } else {
        println!("✅ Redis connection established successfully!");
    }

    // Initialize Backend Actor (IC Agent)
    if let Err(e) = BackendActor::initialize_global(config.clone()).await {
        eprintln!("❌ Failed to initialize Backend Actor: {}", e);
        eprintln!("🔄 Server will continue without IC connection...");
        return Err(std::io::Error::new(
            std::io::ErrorKind::ConnectionRefused,
            format!("IC Backend Actor initialization failed: {}", e)
        ));
    }

    println!("🚀 Server starting at http://localhost:{}", config.port);
    println!("🌍 Environment: {}", config.environment);

    HttpServer::new(|| {
        // Configure CORS
        let cors = Cors::default()
            .allowed_origin("http://localhost:3000")  // Allow Next.js dev server
            .allowed_origin("http://127.0.0.1:3000")  // Alternative localhost
            .allowed_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
            .allowed_headers(vec!["Content-Type", "Authorization", "Accept"])
            .supports_credentials()  // Allow cookies/credentials
            .max_age(3600);  // Cache preflight for 1 hour

        App::new()
            // Add CORS middleware first
            .wrap(cors)
            // Add logging middleware
            .wrap(Logger::default())
            // Configure all routes
            .configure(configure_routes)
    })
    .bind(format!("localhost:{}", config.port))?
    .run()
    .await
}