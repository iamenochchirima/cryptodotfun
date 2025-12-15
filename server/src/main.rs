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
mod db;
mod storage;

use config::AppConfig;
use routes::configure_routes;
use redis::RedisClient;
use ic_agent::BackendActor;
use db::create_pool;
use storage::R2Client;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    
    env_logger::init_from_env(Env::default().default_filter_or("info"));

    let config = AppConfig::from_env();

    let db_pool = create_pool().await.map_err(|e| {
        eprintln!("❌ Failed to connect to PostgreSQL: {}", e);
        std::io::Error::new(
            std::io::ErrorKind::ConnectionRefused,
            format!("PostgreSQL connection failed: {}", e)
        )
    })?;
    println!("✅ PostgreSQL connection established successfully!");

    sqlx::migrate!("./migrations")
        .run(&db_pool)
        .await
        .map_err(|e| {
            eprintln!("❌ Database migration failed: {}", e);
            std::io::Error::new(std::io::ErrorKind::Other, format!("Migration failed: {}", e))
        })?;
    println!("✅ Database migrations completed!");

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

    let r2_client = R2Client::new().await.map_err(|e| {
        eprintln!("❌ Failed to initialize R2 client: {}", e);
        std::io::Error::new(
            std::io::ErrorKind::ConnectionRefused,
            format!("R2 initialization failed: {}", e)
        )
    })?;
    println!("✅ R2 storage client initialized successfully!");

    println!("🚀 Server starting at http://localhost:{}", config.port);
    println!("🌍 Environment: {}", config.environment);

    HttpServer::new(move || {
        // Configure CORS
        let cors = Cors::default()
            .allowed_origin("http://localhost:3000")  // Allow Next.js dev server
            .allowed_origin("http://127.0.0.1:3000")  // Alternative localhost
            .allowed_origin("https://cryptodotfun.com")  // Production frontend
            .allowed_origin("https://www.cryptodotfun.com")  // Production frontend with www
            .allowed_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
            .allowed_headers(vec!["Content-Type", "Authorization", "Accept"])
            .supports_credentials()  // Allow cookies/credentials
            .max_age(3600);  // Cache preflight for 1 hour

        App::new()
            .app_data(actix_web::web::Data::new(db_pool.clone()))
            .app_data(actix_web::web::Data::new(r2_client.clone()))
            .wrap(cors)
            .wrap(Logger::default())
            .configure(configure_routes)
    })
    .bind(format!("localhost:{}", config.port))?
    .run()
    .await
}