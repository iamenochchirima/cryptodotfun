create-canisters:
	dfx canister create --all

deploy-frontend:
	dfx deploy internet_identity

deploy-backend:
	dfx deploy users
	dfx deploy identity_certifier --argument '(principal "o4jpg-z2hcz-bf2oe-zziee-bsw4t-jgecg-boagp-segn6-pdznr-u6bdc-zae")'
	dfx deploy treasury
	dfx deploy marketplace --yes --argument '(record { admin = principal "o4jpg-z2hcz-bf2oe-zziee-bsw4t-jgecg-boagp-segn6-pdznr-u6bdc-zae" })'
	dfx generate users
	dfx generate treasury
	dfx generate marketplace

generate:
	dfx generate
	mkdir -p ../../client/declarations
	rsync -av --delete src/declarations/ ../../client/declarations/

deploy-marketplace:
	dfx deploy marketplace --yes --argument '(record { admin = principal "o4jpg-z2hcz-bf2oe-zziee-bsw4t-jgecg-boagp-segn6-pdznr-u6bdc-zae" })'
	dfx generate marketplace
	mkdir -p ../../client/declarations
	rsync -av src/declarations/marketplace/ ../../client/declarations/marketplace/

deploy-marketplace-live:
	dfx deploy marketplace --yes --argument '(record { admin = principal "o4jpg-z2hcz-bf2oe-zziee-bsw4t-jgecg-boagp-segn6-pdznr-u6bdc-zae" })' --network ic

deploy-users:
	dfx deploy users
	dfx generate users
	mkdir -p ../../client/declarations
	rsync -av src/declarations/users/ ../../client/declarations/users/

deploy-treasury:
	dfx deploy treasury
	dfx generate treasury
	mkdir -p ../../client/declarations
	rsync -av src/declarations/treasury/ ../../client/declarations/treasury/

deploy-identity-certifier:
	dfx deploy identity_certifier --argument '(principal "o4jpg-z2hcz-bf2oe-zziee-bsw4t-jgecg-boagp-segn6-pdznr-u6bdc-zae")'
	dfx generate identity_certifier
	mkdir -p ../../client/declarations
	rsync -av src/declarations/identity_certifier/ ../../client/declarations/identity_certifier/

deploy-all: create-canisters deploy-backend deploy-frontend generate

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


deploy-all-live: deploy-backend


reinstall-marketplace:
	dfx canister install marketplace --mode reinstall --yes --argument '(record { admin = principal "o4jpg-z2hcz-bf2oe-zziee-bsw4t-jgecg-boagp-segn6-pdznr-u6bdc-zae" })'
	dfx generate marketplace
	mkdir -p ../../client/declarations
	rsync -av src/declarations/marketplace/ ../../client/declarations/marketplace/

reinstall-marketplace-live:
	dfx canister install marketplace --mode reinstall --yes --network ic --argument '(record { admin = principal "o4jpg-z2hcz-bf2oe-zziee-bsw4t-jgecg-boagp-segn6-pdznr-u6bdc-zae"; ed25519_key_name = opt variant { MainnetTestKey1 } })'

build:
	cargo build --target wasm32-unknown-unknown --release --package marketplace

