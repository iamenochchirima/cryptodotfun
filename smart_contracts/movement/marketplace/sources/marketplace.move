module marketplace_addr::marketplace {
    use std::error;
    use std::signer;
    use std::option::{Self, Option};
    use aptos_std::smart_vector::{Self, SmartVector};
    use aptos_framework::aptos_account;
    use aptos_framework::coin::{Self};
    use aptos_framework::object::{Self, Object, ExtendRef, DeleteRef};
    use aptos_token_objects::token::{Self, Token};
    use aptos_token_objects::royalty;

    /// Error codes
    const ENO_LISTING: u64 = 1;
    const ENO_SELLER: u64 = 2;
    const ENOT_AUTHORIZED: u64 = 3;
    const EINVALID_PRICE: u64 = 4;
    const EINVALID_FEE: u64 = 5;

    const APP_OBJECT_SEED: vector<u8> = b"NFT_MARKETPLACE";

    // ================================= Structs ================================= //

    /// Marketplace configuration and signer capability
    struct MarketplaceSigner has key {
        extend_ref: ExtendRef,
        /// Marketplace fee numerator (e.g., 250 for 2.5%)
        fee_numerator: u64,
        /// Marketplace fee denominator (e.g., 10000 for 100%)
        fee_denominator: u64,
        /// Address to receive marketplace fees
        fee_recipient: address,
    }

    /// Tracks all sellers in the marketplace
    /// Note: In production, use off-chain indexer instead of on-chain storage
    struct Sellers has key {
        addresses: SmartVector<address>
    }

    /// Individual NFT listing
    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct Listing has key {
        /// The NFT object being listed
        object: Object<Token>,
        /// Seller's address
        seller: address,
        /// Reference to delete listing when sold/delisted
        delete_ref: DeleteRef,
        /// Reference to transfer NFT
        extend_ref: ExtendRef,
    }

    /// Fixed price listing details
    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct FixedPriceListing<phantom CoinType> has key {
        /// Sale price in the specified coin type
        price: u64,
    }

    /// Tracks all listings for a seller
    /// Note: In production, use off-chain indexer instead of on-chain storage
    struct SellerListings has key {
        listings: SmartVector<address>
    }

    // ================================= Initialization ================================= //

    /// Initialize marketplace (called once on module deployment)
    fun init_module(deployer: &signer) {
        let constructor_ref = object::create_named_object(
            deployer,
            APP_OBJECT_SEED,
        );
        let extend_ref = object::generate_extend_ref(&constructor_ref);
        let marketplace_signer = &object::generate_signer(&constructor_ref);

        // Initialize with 2.5% marketplace fee
        move_to(marketplace_signer, MarketplaceSigner {
            extend_ref,
            fee_numerator: 250,      // 2.5%
            fee_denominator: 10000,  // 100%
            fee_recipient: signer::address_of(deployer),
        });

        // Initialize sellers tracker
        move_to(marketplace_signer, Sellers {
            addresses: smart_vector::new(),
        });
    }

    // ================================= Entry Functions ================================= //

    /// List an NFT for sale at a fixed price
    /// @param seller - The signer listing the NFT
    /// @param nft - The NFT object to list
    /// @param price - Sale price in the specified coin type
    public entry fun list_with_fixed_price<CoinType>(
        seller: &signer,
        nft: Object<Token>,
        price: u64,
    ) acquires SellerListings, Sellers, MarketplaceSigner {
        assert!(price > 0, error::invalid_argument(EINVALID_PRICE));
        list_with_fixed_price_internal<CoinType>(seller, nft, price);
    }

    /// Purchase an NFT from a fixed price listing
    /// Handles payment to seller, royalty to creator, and marketplace fee
    /// @param purchaser - The signer purchasing the NFT
    /// @param listing_obj - The listing object containing the NFT
    public entry fun purchase<CoinType>(
        purchaser: &signer,
        listing_obj: Object<Listing>,
    ) acquires FixedPriceListing, Listing, SellerListings, Sellers, MarketplaceSigner {
        let listing_addr = object::object_address(&listing_obj);

        assert!(exists<Listing>(listing_addr), error::not_found(ENO_LISTING));
        assert!(exists<FixedPriceListing<CoinType>>(listing_addr), error::not_found(ENO_LISTING));

        // Get price and extract listing data
        let FixedPriceListing { price } = move_from<FixedPriceListing<CoinType>>(listing_addr);

        let Listing {
            object: nft,
            seller,
            delete_ref,
            extend_ref,
        } = move_from<Listing>(listing_addr);

        // Withdraw full payment from purchaser
        let payment = coin::withdraw<CoinType>(purchaser, price);

        // Calculate and extract marketplace fee
        let marketplace_signer_addr = get_marketplace_signer_addr();
        let marketplace_config = borrow_global<MarketplaceSigner>(marketplace_signer_addr);
        let marketplace_fee = (price * marketplace_config.fee_numerator) / marketplace_config.fee_denominator;
        let fee_coins = coin::extract(&mut payment, marketplace_fee);

        // Calculate and extract royalty if exists
        let royalty_option = token::royalty(nft);

        if (option::is_some(&royalty_option)) {
            let royalty_info = option::extract(&mut royalty_option);
            let royalty_numerator = royalty::numerator(&royalty_info);
            let royalty_denominator = royalty::denominator(&royalty_info);
            let royalty_payee = royalty::payee_address(&royalty_info);

            // Calculate royalty on original price (not after marketplace fee)
            let royalty_amount = (price * royalty_numerator) / royalty_denominator;
            let royalty_coins = coin::extract(&mut payment, royalty_amount);

            // Pay creator royalty
            aptos_account::deposit_coins(royalty_payee, royalty_coins);
        };

        // Transfer NFT to purchaser
        let obj_signer = object::generate_signer_for_extending(&extend_ref);
        object::transfer(&obj_signer, nft, signer::address_of(purchaser));

        // Clean up listing
        object::delete(delete_ref);

        // Remove listing from seller's listings (O(N) operation)
        let seller_listings = borrow_global_mut<SellerListings>(seller);
        let (exists, idx) = smart_vector::index_of(&seller_listings.listings, &listing_addr);
        assert!(exists, error::not_found(ENO_LISTING));
        smart_vector::remove(&mut seller_listings.listings, idx);

        // If seller has no more listings, remove from sellers list
        if (smart_vector::length(&seller_listings.listings) == 0) {
            let sellers = borrow_global_mut<Sellers>(marketplace_signer_addr);
            let (exists, idx) = smart_vector::index_of(&sellers.addresses, &seller);
            assert!(exists, error::not_found(ENO_SELLER));
            smart_vector::remove(&mut sellers.addresses, idx);
        };

        // Pay seller remaining amount (price - marketplace_fee - royalty)
        aptos_account::deposit_coins(seller, payment);

        // Pay marketplace fee
        aptos_account::deposit_coins(marketplace_config.fee_recipient, fee_coins);
    }

    /// Delist (cancel) an NFT listing and return NFT to seller
    /// @param seller - The signer who listed the NFT (must be original seller)
    /// @param listing_obj - The listing object to cancel
    public entry fun delist<CoinType>(
        seller: &signer,
        listing_obj: Object<Listing>,
    ) acquires Listing, FixedPriceListing, SellerListings, Sellers {
        let listing_addr = object::object_address(&listing_obj);

        assert!(exists<Listing>(listing_addr), error::not_found(ENO_LISTING));

        let Listing {
            object: nft,
            seller: listing_seller,
            delete_ref,
            extend_ref,
        } = move_from<Listing>(listing_addr);

        // Verify caller is the seller
        assert!(signer::address_of(seller) == listing_seller, error::permission_denied(ENOT_AUTHORIZED));

        // Return NFT to seller
        let obj_signer = object::generate_signer_for_extending(&extend_ref);
        object::transfer(&obj_signer, nft, listing_seller);

        // Clean up price listing
        if (exists<FixedPriceListing<CoinType>>(listing_addr)) {
            let FixedPriceListing { price: _ } = move_from<FixedPriceListing<CoinType>>(listing_addr);
        };

        object::delete(delete_ref);

        // Remove from seller's listings (O(N) operation)
        let seller_listings = borrow_global_mut<SellerListings>(listing_seller);
        let (exists, idx) = smart_vector::index_of(&seller_listings.listings, &listing_addr);
        assert!(exists, error::not_found(ENO_LISTING));
        smart_vector::remove(&mut seller_listings.listings, idx);

        // If seller has no more listings, remove from sellers list
        if (smart_vector::length(&seller_listings.listings) == 0) {
            let marketplace_signer_addr = get_marketplace_signer_addr();
            let sellers = borrow_global_mut<Sellers>(marketplace_signer_addr);
            let (exists, idx) = smart_vector::index_of(&sellers.addresses, &listing_seller);
            assert!(exists, error::not_found(ENO_SELLER));
            smart_vector::remove(&mut sellers.addresses, idx);
        };
    }

    /// Update marketplace fee (admin only)
    /// @param admin - Must be the original deployer/fee recipient
    /// @param new_fee_numerator - New fee numerator
    /// @param new_fee_denominator - New fee denominator
    public entry fun update_marketplace_fee(
        admin: &signer,
        new_fee_numerator: u64,
        new_fee_denominator: u64,
    ) acquires MarketplaceSigner {
        assert!(new_fee_numerator <= new_fee_denominator, error::invalid_argument(EINVALID_FEE));

        let marketplace_signer_addr = get_marketplace_signer_addr();
        let marketplace_config = borrow_global_mut<MarketplaceSigner>(marketplace_signer_addr);

        // Only current fee recipient can update
        assert!(signer::address_of(admin) == marketplace_config.fee_recipient, error::permission_denied(ENOT_AUTHORIZED));

        marketplace_config.fee_numerator = new_fee_numerator;
        marketplace_config.fee_denominator = new_fee_denominator;
    }

    /// Update fee recipient address (admin only)
    /// @param admin - Must be the current fee recipient
    /// @param new_recipient - New address to receive fees
    public entry fun update_fee_recipient(
        admin: &signer,
        new_recipient: address,
    ) acquires MarketplaceSigner {
        let marketplace_signer_addr = get_marketplace_signer_addr();
        let marketplace_config = borrow_global_mut<MarketplaceSigner>(marketplace_signer_addr);

        // Only current fee recipient can update
        assert!(signer::address_of(admin) == marketplace_config.fee_recipient, error::permission_denied(ENOT_AUTHORIZED));

        marketplace_config.fee_recipient = new_recipient;
    }

    // ================================= Internal Functions ================================= //

    fun list_with_fixed_price_internal<CoinType>(
        seller: &signer,
        nft: Object<Token>,
        price: u64,
    ): Object<Listing> acquires SellerListings, Sellers, MarketplaceSigner {
        // Create listing object owned by seller
        let constructor_ref = object::create_object(signer::address_of(seller));

        let transfer_ref = object::generate_transfer_ref(&constructor_ref);
        object::disable_ungated_transfer(&transfer_ref);

        let listing_signer = object::generate_signer(&constructor_ref);

        // Create listing data
        let listing = Listing {
            object: nft,
            seller: signer::address_of(seller),
            delete_ref: object::generate_delete_ref(&constructor_ref),
            extend_ref: object::generate_extend_ref(&constructor_ref),
        };

        let fixed_price_listing = FixedPriceListing<CoinType> {
            price,
        };

        move_to(&listing_signer, listing);
        move_to(&listing_signer, fixed_price_listing);

        // Transfer NFT to listing (escrow)
        object::transfer(seller, nft, signer::address_of(&listing_signer));

        let listing_obj = object::object_from_constructor_ref(&constructor_ref);
        let listing_addr = object::object_address(&listing_obj);

        // Track listing under seller
        if (exists<SellerListings>(signer::address_of(seller))) {
            let seller_listings = borrow_global_mut<SellerListings>(signer::address_of(seller));
            smart_vector::push_back(&mut seller_listings.listings, listing_addr);
        } else {
            let seller_listings = SellerListings {
                listings: smart_vector::new(),
            };
            smart_vector::push_back(&mut seller_listings.listings, listing_addr);
            move_to(seller, seller_listings);
        };

        // Track seller in marketplace
        let marketplace_signer_addr = get_marketplace_signer_addr();
        if (exists<Sellers>(marketplace_signer_addr)) {
            let sellers = borrow_global_mut<Sellers>(marketplace_signer_addr);
            if (!smart_vector::contains(&sellers.addresses, &signer::address_of(seller))) {
                smart_vector::push_back(&mut sellers.addresses, signer::address_of(seller));
            }
        } else {
            let sellers = Sellers {
                addresses: smart_vector::new(),
            };
            smart_vector::push_back(&mut sellers.addresses, signer::address_of(seller));
            move_to(&get_marketplace_signer(marketplace_signer_addr), sellers);
        };

        listing_obj
    }

    // ================================= View Functions ================================= //

    #[view]
    /// Get the price of a fixed price listing
    public fun price<CoinType>(
        listing_obj: Object<Listing>,
    ): Option<u64> acquires FixedPriceListing {
        let listing_addr = object::object_address(&listing_obj);
        if (exists<FixedPriceListing<CoinType>>(listing_addr)) {
            let fixed_price = borrow_global<FixedPriceListing<CoinType>>(listing_addr);
            option::some(fixed_price.price)
        } else {
            option::none()
        }
    }

    #[view]
    /// Get listing details (NFT object and seller address)
    public fun listing(listing_obj: Object<Listing>): (Object<Token>, address) acquires Listing {
        let listing_data = borrow_listing(listing_obj);
        (listing_data.object, listing_data.seller)
    }

    #[view]
    /// Get all listing addresses for a seller
    public fun get_seller_listings(seller: address): vector<address> acquires SellerListings {
        if (exists<SellerListings>(seller)) {
            smart_vector::to_vector(&borrow_global<SellerListings>(seller).listings)
        } else {
            vector[]
        }
    }

    #[view]
    /// Get all seller addresses in the marketplace
    public fun get_sellers(): vector<address> acquires Sellers {
        let marketplace_signer_addr = get_marketplace_signer_addr();
        if (exists<Sellers>(marketplace_signer_addr)) {
            smart_vector::to_vector(&borrow_global<Sellers>(marketplace_signer_addr).addresses)
        } else {
            vector[]
        }
    }

    #[view]
    /// Get current marketplace fee configuration
    public fun get_marketplace_fee(): (u64, u64, address) acquires MarketplaceSigner {
        let marketplace_signer_addr = get_marketplace_signer_addr();
        let config = borrow_global<MarketplaceSigner>(marketplace_signer_addr);
        (config.fee_numerator, config.fee_denominator, config.fee_recipient)
    }

    #[view]
    /// Get marketplace address
    public fun get_marketplace_address(): address {
        get_marketplace_signer_addr()
    }

    // ================================= Helper Functions ================================= //

    fun get_marketplace_signer_addr(): address {
        object::create_object_address(&@marketplace_addr, APP_OBJECT_SEED)
    }

    fun get_marketplace_signer(marketplace_signer_addr: address): signer acquires MarketplaceSigner {
        object::generate_signer_for_extending(&borrow_global<MarketplaceSigner>(marketplace_signer_addr).extend_ref)
    }

    inline fun borrow_listing(listing_obj: Object<Listing>): &Listing acquires Listing {
        let obj_addr = object::object_address(&listing_obj);
        assert!(exists<Listing>(obj_addr), error::not_found(ENO_LISTING));
        borrow_global<Listing>(obj_addr)
    }

    // ================================= Test-Only Functions ================================= //

    #[test_only]
    public fun setup_test(marketplace: &signer) {
        init_module(marketplace);
    }
}
