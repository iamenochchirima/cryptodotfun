use std::env;

#[derive(Debug, Clone)]
pub struct AppConfig {
    pub port: u16,
    pub environment: String,
    pub identity_key: String,
    pub identity_provider_canister_id: String,
    pub redis_url: String,
    pub ic_host: String,
    pub network: String,
    pub identity_pem_path: String,
}

impl AppConfig {
    pub fn from_env() -> Self {
        let environment = env::var("ENVIRONMENT").unwrap_or_else(|_| "development".to_string());
        let network = if environment == "production" { "ic" } else { "local" };
        let ic_host = if network == "ic" {
            "https://icp0.io"
        } else {
            "http://127.0.0.1:4943"
        };

        Self {
            port: env::var("PORT")
                .unwrap_or_else(|_| "8080".to_string())
                .parse()
                .expect("PORT must be a valid number"),
            environment,
            identity_key: env::var("IDENTITY_KEY").unwrap_or_else(|_| "".to_string()),
            identity_provider_canister_id: env::var("IDENTITY_PROVIDER_CANISTER_ID")
                .unwrap_or_else(|_| "umunu-kh777-77774-qaaca-cai".to_string()),
            redis_url: env::var("REDIS_URL").unwrap_or_else(|_| "".to_string()),
            ic_host: ic_host.to_string(),
            network: network.to_string(),
            identity_pem_path: env::var("IDENTITY_PEM_PATH")
                .unwrap_or_else(|_| "./dotfun_admin.pem".to_string()),
        }
    }

    pub fn is_local(&self) -> bool {
        self.network == "local"
    }

    pub fn is_production(&self) -> bool {
        self.network == "ic"
    }
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            port: 8080,
            environment: "local".to_string(),
            identity_key: "".to_string(),
            identity_provider_canister_id: "".to_string(),
            ic_host: "http://127.0.0.1:4943".to_string(),
            network: "local".to_string(),
            redis_url: "".to_string(),
            identity_pem_path: "./dotfun_admin.pem".to_string(),
        }
    }
}
