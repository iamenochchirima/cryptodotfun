use super::{client, solana_wallet::SolanaWallet};
use crate::state::{config, get_collection};
use candid::Principal;
use solana_instruction::{AccountMeta, Instruction};
use solana_message::Message;
use solana_pubkey::Pubkey;
use solana_transaction::Transaction;
use std::str::FromStr;

pub async fn deploy_candy_machine_for_user(
    collection_id: String,
    user_wallet_address: String,
) -> Result<String, String> {
    let collection = get_collection(&collection_id)
        .ok_or("Collection not found")?;

    let user_pubkey = Pubkey::from_str(&user_wallet_address)
        .map_err(|e| format!("Invalid wallet address: {}", e))?;

    let canister_wallet = SolanaWallet::new(ic_cdk::id()).await;
    let payer = canister_wallet.solana_account();

    let candy_machine_account = canister_wallet.derive_account(
        format!("candy-machine-{}", collection_id).as_bytes().into()
    );

    ic_cdk::println!("Step 1: Creating Candy Machine with canister as temporary authority");

    let create_instructions = build_candy_machine_create_instructions(
        payer.as_ref(),
        candy_machine_account.as_ref(),
        payer.as_ref(),
        collection.total_supply,
        collection.royalty_bps,
        &collection.symbol,
    )?;

    let create_message = Message::new_with_blockhash(
        &create_instructions,
        Some(payer.as_ref()),
        &client().estimate_recent_blockhash().send().await
            .map_err(|e| format!("Failed to get blockhash: {}", e))?,
    );

    let create_signatures = vec![
        payer.sign_message(&create_message).await,
        candy_machine_account.sign_message(&create_message).await,
    ];

    let create_tx = Transaction {
        message: create_message,
        signatures: create_signatures,
    };

    client()
        .send_transaction(create_tx)
        .send()
        .await
        .expect_consistent()
        .map_err(|e| format!("Failed to create candy machine: {}", e))?;

    ic_cdk::println!("Step 2: Transferring authority to user wallet");

    let transfer_instruction = build_update_authority_instruction(
        candy_machine_account.as_ref(),
        payer.as_ref(),
        &user_pubkey,
    )?;

    let transfer_message = Message::new_with_blockhash(
        &[transfer_instruction],
        Some(payer.as_ref()),
        &client().estimate_recent_blockhash().send().await
            .map_err(|e| format!("Failed to get blockhash: {}", e))?,
    );

    let transfer_signatures = vec![
        payer.sign_message(&transfer_message).await,
    ];

    let transfer_tx = Transaction {
        message: transfer_message,
        signatures: transfer_signatures,
    };

    client()
        .send_transaction(transfer_tx)
        .send()
        .await
        .expect_consistent()
        .map_err(|e| format!("Failed to transfer authority: {}", e))?;

    ic_cdk::println!("Candy Machine deployed and ownership transferred!");

    Ok(candy_machine_account.as_ref().to_string())
}

fn build_candy_machine_create_instructions(
    payer: &Pubkey,
    candy_machine: &Pubkey,
    authority: &Pubkey,
    items_available: u64,
    seller_fee_basis_points: u16,
    symbol: &str,
) -> Result<Vec<Instruction>, String> {
    // TODO: Implement actual Metaplex Candy Machine v3 instruction encoding
    // This is a placeholder that needs to be replaced with proper Metaplex instructions

    ic_cdk::println!(
        "Building Candy Machine create instructions:\n\
        Payer: {}\n\
        Candy Machine: {}\n\
        Authority: {}\n\
        Items: {}\n\
        Royalty: {}bps\n\
        Symbol: {}",
        payer, candy_machine, authority, items_available, seller_fee_basis_points, symbol
    );

    Err("Metaplex instruction encoding not yet implemented".to_string())
}

fn build_update_authority_instruction(
    candy_machine: &Pubkey,
    current_authority: &Pubkey,
    new_authority: &Pubkey,
) -> Result<Instruction, String> {
    // TODO: Implement actual Metaplex authority transfer instruction

    ic_cdk::println!(
        "Building authority transfer instruction:\n\
        Candy Machine: {}\n\
        From: {}\n\
        To: {}",
        candy_machine, current_authority, new_authority
    );

    Err("Metaplex authority transfer not yet implemented".to_string())
}
