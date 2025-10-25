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
				\"$$(dfx canister id identity_certifier)\"; \
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
				\"$$(dfx canister id identity_certifier)\"; \
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
			statement = opt \"Login to the CryptoDotFun\"; \
			sign_in_expires_in = opt 1500000000000; \
			session_expires_in = opt 604800000000000; \
			targets = opt vec { \
				\"$$(dfx canister id ic_siwb_provider)\"; \
				\"$$(dfx canister id users)\"; \
				\"$$(dfx canister id identity_certifier)\"; \
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
	        statement = opt \"Login to the CryptoDotFun\"; \
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
	dfx deploy identity_certifier --argument '(principal "o4jpg-z2hcz-bf2oe-zziee-bsw4t-jgecg-boagp-segn6-pdznr-u6bdc-zae")'
	dfx deploy icp_market --yes --argument '(record { admin = principal "o4jpg-z2hcz-bf2oe-zziee-bsw4t-jgecg-boagp-segn6-pdznr-u6bdc-zae"; collection_creation_fee = 0; marketplace_fee_percentage = 250 })'
	dfx deploy sol_market --yes --argument '(record { admin = principal "o4jpg-z2hcz-bf2oe-zziee-bsw4t-jgecg-boagp-segn6-pdznr-u6bdc-zae" })'
	dfx generate icp_market
	dfx generate sol_market
	dfx generate users

deploy-all: create-canisters deploy-provider deploy-backend  deploy-frontend

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


deploy-providers-live:
	dfx install ic_siws_provider --mode upgrade --argument "( \
	    record { \
			domain = \"cryptodotfun.com\"; \
	        uri = \"https://cryptodotfun.com\"; \
	        salt = \"salt\"; \
		  	chain_id = opt \"mainnet\"; \
	        scheme = opt \"https\"; \
	        statement = opt \"Login to the CryptoDotFun\"; \
	        sign_in_expires_in = opt 300000000000; /* 5 minutes */ \
	        session_expires_in = opt 604800000000000; /* 1 week */ \
	        targets = opt vec { \
	            \"$$(dfx canister id ic_siws_provider --network ic)\"; \
				\"$$(dfx canister id users --network ic)\"; \
	        }; \
		  runtime_features = null; \
	    } \
	)" --network ic

	dfx deploy ic_siwe_provider --argument "( \
	    record { \
	        domain = \"cryptodotfun.com\"; \
	        uri = \"https://cryptodotfun.com\"; \
	        salt = \"salt\"; \
	        chain_id = opt 1; \
	        scheme = opt \"https\"; \
	        statement = opt \"Login to the CryptoDotFun\"; \
	        sign_in_expires_in = opt 300000000000; /* 5 minutes */ \
	        session_expires_in = opt 604800000000000; /* 1 week */ \
	        targets = opt vec { \
	            \"$$(dfx canister id ic_siwe_provider --network ic)\"; \
				\"$$(dfx canister id users --network ic)\"; \
	        }; \
	    } \
	)" --network ic

	dfx deploy ic_siwb_provider --argument "( \
		record { \
			domain = \"cryptodotfun.com\"; \
			uri = \"https://cryptodotfun.com\"; \
			salt = \"123456\"; \
			network = opt \"mainnet\"; \
			scheme = opt \"https\"; \
			statement = opt \"Login to the CryptoDotFun\"; \
			sign_in_expires_in = opt 1500000000000; \
			session_expires_in = opt 604800000000000; \
			targets = opt vec { \
				\"$$(dfx canister id ic_siwb_provider --network ic)\"; \
				\"$$(dfx canister id users --network ic)\"; \
			}; \
		} \
	)" --network ic	
	
deploy-all-live: deploy-providers-live deploy-backend 

reinstall-providers-live:
	dfx canister install ic_siws_provider --mode reinstall --argument "( \
	    record { \
			domain = \"cryptodotfun.com\"; \
	        uri = \"https://cryptodotfun.com\"; \
	        salt = \"salt\"; \
		  	chain_id = opt \"mainnet\"; \
	        scheme = opt \"https\"; \
	        statement = opt \"Login to the CryptoDotFun\"; \
	        sign_in_expires_in = opt 300000000000; /* 5 minutes */ \
	        session_expires_in = opt 604800000000000; /* 1 week */ \
	        targets = opt vec { \
	            \"$$(dfx canister id ic_siws_provider --network ic)\"; \
				\"$$(dfx canister id users --network ic)\"; \
	        }; \
		  runtime_features = null; \
	    } \
	)" --network ic

# 	dfx canister install ic_siwe_provider --mode reinstall --argument "( \
# 	    record { \
# 	        domain = \"cryptodotfun.com\"; \
# 	        uri = \"https://cryptodotfun.com\"; \
# 	        salt = \"salt\"; \
# 	        chain_id = opt 1; \
# 	        scheme = opt \"https\"; \
# 	        statement = opt \"Login to the CryptoDotFun\"; \
# 	        sign_in_expires_in = opt 300000000000; /* 5 minutes */ \
# 	        session_expires_in = opt 604800000000000; /* 1 week */ \
# 	        targets = opt vec { \
# 	            \"$$(dfx canister id ic_siwe_provider --network ic)\"; \
# 				\"$$(dfx canister id users --network ic)\"; \
# 	        }; \
# 	    } \
# 	)" --network ic

# 	dfx canister install ic_siwb_provider --mode reinstall --argument "( \
# 		record { \
# 			domain = \"cryptodotfun.com\"; \
# 			uri = \"https://cryptodotfun.com\"; \
# 			salt = \"123456\"; \
# 			network = opt \"mainnet\"; \
# 			scheme = opt \"https\"; \
# 			statement = opt \"Login to the CryptoDotFun\"; \
# 			sign_in_expires_in = opt 1500000000000; \
# 			session_expires_in = opt 604800000000000; \
# 			targets = opt vec { \	
# 				\"$$(dfx canister id ic_siwb_provider --network ic)\"; \
# 				\"$$(dfx canister id users --network ic)\"; \
# 			}; \
# 		} \
# 	)" --network ic


reinstall-all-live: reinstall-providers-live 


