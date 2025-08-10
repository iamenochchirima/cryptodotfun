use ic_agent::{Agent, identity::Secp256k1Identity};
use candid::{Encode, Decode, Principal};
use std::sync::Arc;
use tokio::sync::OnceCell;
use crate::config::AppConfig;

// Global instance of the backend actor
static BACKEND_ACTOR: OnceCell<Arc<BackendActor>> = OnceCell::const_new();

#[derive(Debug, Clone)]
pub struct BackendActor {
    pub agent: Agent,
    pub canister_id: Principal,
    pub config: AppConfig,
}

impl BackendActor {
    /// Initialize the backend actor with configuration
    pub async fn init(config: AppConfig) -> Result<Arc<Self>, Box<dyn std::error::Error + Send + Sync>> {
        println!("🔄 Initializing IC Backend Actor...");
        
        // Load identity from PEM file
        let identity = Self::load_identity_from_pem(&config.identity_pem_path)?;

        println!("Canister ID: {}", config.identity_provider_canister_id);

        // Create agent
        let agent = Agent::builder()
            .with_url(&config.ic_host)
            .with_identity(identity)
            .build()?;

        // Fetch root key for local development
        if config.is_local() {
            println!("🔑 Fetching root key for local development...");
            agent.fetch_root_key().await?;
        }

        // Parse canister ID
        let canister_id = Principal::from_text(&config.identity_provider_canister_id)
            .map_err(|e| format!("Invalid canister ID: {}", e))?;

        let backend_actor = Arc::new(BackendActor {
            agent,
            canister_id,
            config: config.clone(),
        });

        println!("✅ IC Backend Actor initialized successfully!");
        println!("🌐 Network: {}", config.network);
        println!("🏠 Host: {}", config.ic_host);
        println!("📦 Canister ID: {}", config.identity_provider_canister_id);
        println!("🔐 Identity PEM: {}", config.identity_pem_path);

        Ok(backend_actor)
    }

    /// Get the global instance of the backend actor
    pub async fn instance() -> &'static Arc<BackendActor> {
        BACKEND_ACTOR.get().expect("BackendActor not initialized. Call BackendActor::init() first.")
    }

    /// Initialize and store the global instance
    pub async fn initialize_global(config: AppConfig) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let actor = Self::init(config).await?;
        BACKEND_ACTOR.set(actor).map_err(|_| "BackendActor already initialized")?;
        Ok(())
    }

    /// Load identity from PEM file
    fn load_identity_from_pem(pem_path: &str) -> Result<Secp256k1Identity, Box<dyn std::error::Error + Send + Sync>> {
        // Try to load as Secp256k1 identity first
        match Secp256k1Identity::from_pem_file(pem_path) {
            Ok(identity) => Ok(identity),
            Err(_) => {
                // If Secp256k1 fails, you could try BasicIdentity as a fallback
                // For now, we'll just return the Secp256k1 error
                Err(format!("Failed to load identity from PEM file: {}", pem_path).into())
            }
        }
    }

    /// Call a query method on the canister
    pub async fn query<T, R>(&self, method: &str, args: T) -> Result<R, Box<dyn std::error::Error + Send + Sync>>
    where
        T: candid::CandidType,
        R: for<'de> candid::Deserialize<'de> + candid::CandidType,
    {
        let arg = Encode!(&args)?;
        let response = self.agent
            .query(&self.canister_id, method)
            .with_arg(arg)
            .call()
            .await?;

        let result = Decode!(response.as_slice(), R)?;
        Ok(result)
    }

    /// Call an update method on the canister
    pub async fn update<T, R>(&self, method: &str, args: T) -> Result<R, Box<dyn std::error::Error + Send + Sync>>
    where
        T: candid::CandidType,
        R: for<'de> candid::Deserialize<'de> + candid::CandidType,
    {
        let arg = Encode!(&args)?;
        let response = self.agent
            .update(&self.canister_id, method)
            .with_arg(arg)
            .call_and_wait()
            .await?;

        let result = Decode!(response.as_slice(), R)?;
        Ok(result)
    }

    /// Get the agent's principal
    pub fn get_principal(&self) -> Principal {
        self.agent.get_principal().unwrap_or(Principal::anonymous())
    }
}

/// Convenience function to get the backend actor instance
pub async fn get_backend_actor() -> &'static Arc<BackendActor> {
    BackendActor::instance().await
}

// Define common data structures
#[derive(candid::CandidType, candid::Deserialize, serde::Serialize)]
pub struct UserData {
    pub username: String,
    pub email: Option<String>,
    pub principal: Principal,
    pub created_at: u64,
}

/// Example usage functions for common operations

// Example: Check username availability
pub async fn check_username_availability(username: &str) -> Result<bool, Box<dyn std::error::Error + Send + Sync>> {
    let actor = get_backend_actor().await;
    
    // Define the argument structure based on your canister's interface
    #[derive(candid::CandidType)]
    struct CheckUsernameArgs {
        username: String,
    }

    let args = CheckUsernameArgs {
        username: username.to_string(),
    };

    // Call the canister method - replace with your actual method name
    let result: bool = actor.query("check_username_availability", args).await?;
    Ok(result)
}

// Example: Create user
pub async fn create_user(username: &str, email: Option<String>) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
    let actor = get_backend_actor().await;
    
    #[derive(candid::CandidType)]
    struct CreateUserArgs {
        username: String,
        email: Option<String>,
    }

    let args = CreateUserArgs {
        username: username.to_string(),
        email,
    };

    // Call the canister method - replace with your actual method name
    let result: String = actor.update("create_user", args).await?;
    Ok(result)
}

// Example: Get user by principal
pub async fn get_user_by_principal(principal: Principal) -> Result<Option<UserData>, Box<dyn std::error::Error + Send + Sync>> {
    let actor = get_backend_actor().await;
    
    #[derive(candid::CandidType)]
    struct GetUserArgs {
        principal: Principal,
    }

    let args = GetUserArgs { principal };

    let result: Option<UserData> = actor.query("get_user_by_principal", args).await?;
    Ok(result)
}
