create-canisters:
	dfx canister create --all

deploy-provider:
	dfx deploy ic_siws_provider --argument "( \
	    record { \
			domain = \"localhost:3000\"; \
	        uri = \"http://localhost:3000\"; \
	        salt = \"salt\"; \
          chain_id = opt \"mainnet\"; \
	        scheme = opt \"http\"; \
	        statement = opt \"Login to CryptoDotFun\"; \
	        sign_in_expires_in = opt 300000000000; /* 5 minutes */ \
	        session_expires_in = opt 604800000000000; /* 1 week */ \
	        targets = opt vec { \
	            \"$$(dfx canister id ic_siws_provider)\"; \
	            \"$$(dfx canister id users)\"; \
	        }; \
          runtime_features = null; \
	    } \
	)"
	dfx generate ic_siws_provider
	dfx deploy ic_siwe_provider --argument "( \
	    record { \
	        domain = \"127.0.0.1\"; \
	        uri = \"http://127.0.0.1:3000\"; \
	        salt = \"salt\"; \
	        chain_id = opt 1; \
	        scheme = opt \"http\"; \
	        statement = opt \"Login to CryptoDotFun\"; \
	        sign_in_expires_in = opt 300000000000; /* 5 minutes */ \
	        session_expires_in = opt 604800000000000; /* 1 week */ \
	        targets = opt vec { \
	            \"$$(dfx canister id ic_siwe_provider)\"; \
	            \"$$(dfx canister id users)\"; \
	        }; \
	    } \
	)"
	dfx generate ic_siwe_provider
	dfx deploy ic_siwb_provider --argument "( \
		record { \
			domain = \"127.0.0.1\"; \
			uri = \"http://127.0.0.1:5173\"; \
			salt = \"123456\"; \
			network = opt \"testnet\"; \
			scheme = opt \"http\"; \
			statement = opt \"Login to the app\"; \
			sign_in_expires_in = opt 1500000000000; \
			session_expires_in = opt 604800000000000; \
			targets = opt vec { \
				\"$$(dfx canister id ic_siwb_provider)\"; \
				\"$$(dfx canister id users)\"; \
			}; \
		} \
	)"
	dfx generate ic_siwb_provider

upgrade-provider:
	dfx canister install ic_siws_provider --mode upgrade --upgrade-unchanged --argument "( \
	    record { \
			domain = \"localhost:3000\"; \
	        uri = \"http://localhost:3000\"; \
	        salt = \"salt\"; \
          chain_id = opt \"mainnet\"; \
	        scheme = opt \"http\"; \
	        statement = opt \"Login to the siws/IC demo app\"; \
	        sign_in_expires_in = opt 300000000000; /* 5 minutes */ \
	        session_expires_in = opt 604800000000000; /* 1 week */ \
	        targets = opt vec { \
	            \"$$(dfx canister id ic_siws_provider)\"; \
				\"$$(dfx canister id users)\"; \
	        }; \
          runtime_features = null; \
	    } \
	)"
	dfx generate ic_siws_provider

deploy-frontend:
	dfx deploy internet_identity

deploy-backend:
	dfx deploy users
	dfx generate users

deploy-all: create-canisters deploy-provider deploy-backend deploy-frontend

run-frontend:
	pnpm install
	pnpm run dev

clean:
	rm -rf .dfx
	rm -rf dist
	rm -rf node_modules
	rm -rf src/declarations
	rm -f .env
	cargo clean

