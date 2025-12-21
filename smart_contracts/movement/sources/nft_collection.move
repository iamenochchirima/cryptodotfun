module nft_launchpad::nft_collection {
    use std::error;
    use std::option::{Self, Option};
    use std::signer;
    use std::string::String;
    use std::vector;
    use aptos_framework::object;
    use aptos_token_objects::collection;
    use aptos_token_objects::token;
    use aptos_token_objects::royalty;

    /// Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_COLLECTION_DOES_NOT_EXIST: u64 = 2;
    const E_INVALID_ROYALTY: u64 = 3;

    /// Struct to store collection data and refs for mutations
    struct CollectionData has key {
        /// Reference to mutate collection metadata
        mutator_ref: collection::MutatorRef,
    }

    /// Struct to store token minting capability
    struct MintingCapability has key {
        /// Reference to extend the token object
        extend_ref: object::ExtendRef,
    }

    /// Create a new NFT collection with optional max supply
    /// @param creator - The signer creating the collection
    /// @param description - Collection description
    /// @param name - Collection name (must be unique per creator)
    /// @param uri - Collection metadata URI
    /// @param max_supply - Optional maximum supply (None = unlimited)
    /// @param royalty_numerator - Royalty percentage numerator (e.g., 5 for 5%)
    /// @param royalty_denominator - Royalty percentage denominator (e.g., 100 for %)
    public entry fun create_collection(
        creator: &signer,
        description: String,
        name: String,
        uri: String,
        max_supply: Option<u64>,
        royalty_numerator: u64,
        royalty_denominator: u64,
    ) {
        // Validate royalty
        assert!(royalty_numerator <= royalty_denominator, error::invalid_argument(E_INVALID_ROYALTY));

        // Create royalty if specified
        let royalty_option = if (royalty_numerator > 0) {
            option::some(royalty::create(royalty_numerator, royalty_denominator, signer::address_of(creator)))
        } else {
            option::none()
        };

        // Create collection based on max_supply
        let constructor_ref = if (option::is_some(&max_supply)) {
            // Fixed supply collection
            collection::create_fixed_collection(
                creator,
                description,
                *option::borrow(&max_supply),
                name,
                royalty_option,
                uri,
            )
        } else {
            // Unlimited supply collection
            collection::create_unlimited_collection(
                creator,
                description,
                name,
                royalty_option,
                uri,
            )
        };

        // Generate mutator ref to allow future metadata updates
        let mutator_ref = collection::generate_mutator_ref(&constructor_ref);
        let extend_ref = object::generate_extend_ref(&constructor_ref);

        // Store collection data
        let collection_signer = object::generate_signer(&constructor_ref);
        move_to(&collection_signer, CollectionData {
            mutator_ref,
        });

        // Store minting capability
        move_to(&collection_signer, MintingCapability {
            extend_ref,
        });
    }

    /// Mint a new NFT token in a collection
    /// @param creator - The signer minting the token (must be collection creator)
    /// @param collection_name - Name of the collection
    /// @param description - Token description
    /// @param name - Token name (must be unique within collection)
    /// @param uri - Token metadata URI
    /// @param recipient - Address to receive the minted token
    public entry fun mint_token(
        creator: &signer,
        collection_name: String,
        description: String,
        name: String,
        uri: String,
        recipient: address,
    ) {
        let creator_address = signer::address_of(creator);

        // Get collection object
        let collection_obj = collection::create_collection_address(&creator_address, &collection_name);

        // Verify collection exists
        assert!(object::object_exists<CollectionData>(collection_obj), error::not_found(E_COLLECTION_DOES_NOT_EXIST));

        // Create named token (deterministic address)
        let constructor_ref = token::create_named_token(
            creator,
            collection_name,
            description,
            name,
            option::none(), // No royalty override
            uri,
        );

        // Generate refs for token
        let token_signer = object::generate_signer(&constructor_ref);
        let transfer_ref = object::generate_transfer_ref(&constructor_ref);

        // Transfer token to recipient
        let linear_transfer_ref = object::generate_linear_transfer_ref(&transfer_ref);
        object::transfer_with_ref(linear_transfer_ref, recipient);

        // Disable further transfers to make it soulbound (optional - can be removed)
        // object::disable_ungated_transfer(&transfer_ref);
    }

    /// Mint multiple tokens at once (batch minting)
    /// @param creator - The signer minting the tokens
    /// @param collection_name - Name of the collection
    /// @param descriptions - Vector of token descriptions
    /// @param names - Vector of token names
    /// @param uris - Vector of token metadata URIs
    /// @param recipient - Address to receive all minted tokens
    public entry fun batch_mint_tokens(
        creator: &signer,
        collection_name: String,
        descriptions: vector<String>,
        names: vector<String>,
        uris: vector<String>,
        recipient: address,
    ) {
        let len = vector::length(&names);
        let i = 0;

        while (i < len) {
            mint_token(
                creator,
                collection_name,
                *vector::borrow(&descriptions, i),
                *vector::borrow(&names, i),
                *vector::borrow(&uris, i),
                recipient,
            );
            i = i + 1;
        };
    }

    /// Update collection description
    public entry fun update_collection_description(
        creator: &signer,
        collection_name: String,
        new_description: String,
    ) acquires CollectionData {
        let creator_address = signer::address_of(creator);
        let collection_obj = collection::create_collection_address(&creator_address, &collection_name);

        assert!(object::object_exists<CollectionData>(collection_obj), error::not_found(E_COLLECTION_DOES_NOT_EXIST));

        let collection_data = borrow_global<CollectionData>(collection_obj);
        collection::set_description(&collection_data.mutator_ref, new_description);
    }

    /// Update collection URI
    public entry fun update_collection_uri(
        creator: &signer,
        collection_name: String,
        new_uri: String,
    ) acquires CollectionData {
        let creator_address = signer::address_of(creator);
        let collection_obj = collection::create_collection_address(&creator_address, &collection_name);

        assert!(object::object_exists<CollectionData>(collection_obj), error::not_found(E_COLLECTION_DOES_NOT_EXIST));

        let collection_data = borrow_global<CollectionData>(collection_obj);
        collection::set_uri(&collection_data.mutator_ref, new_uri);
    }

    // ========================= View Functions =========================

    #[view]
    /// Check if a collection exists
    public fun collection_exists(creator: address, collection_name: String): bool {
        let collection_obj = collection::create_collection_address(&creator, &collection_name);
        object::object_exists<CollectionData>(collection_obj)
    }

    #[view]
    /// Get collection address
    public fun get_collection_address(creator: address, collection_name: String): address {
        collection::create_collection_address(&creator, &collection_name)
    }

    #[view]
    /// Get token address
    public fun get_token_address(creator: address, collection_name: String, token_name: String): address {
        token::create_token_address(&creator, &collection_name, &token_name)
    }
}
