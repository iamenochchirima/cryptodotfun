import { create, mplCandyMachine } from '@metaplex-foundation/mpl-core-candy-machine'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import {
  publicKey as umiPublicKey,
  some,
  sol,
  dateTime,
  createNoopSigner,
  signerIdentity,
  AccountMeta
} from '@metaplex-foundation/umi'

export interface CandyMachineConfig {
  collectionId: string
  name: string
  symbol: string
  supply: number
  mintPrice: number // in SOL
  goLiveDate?: string
  royaltyBps: number
  manifestUrl: string
  canisterPayerAddress: string // The canister's Solana address
  candyMachineAddress: string // Will be populated
  network?: 'devnet' | 'mainnet-beta'
}

export interface CandyMachineInstructionData {
  programId: string
  accounts: Array<{
    pubkey: string
    isSigner: boolean
    isWritable: boolean
  }>
  data: Uint8Array
}

/**
 * Creates Candy Machine instruction data
 * This instruction data will be sent to the canister which will:
 * - Fetch recent blockhash using estimate_recent_blockhash
 * - Build the complete transaction message
 * - Sign and send to Solana
 */
export async function createCandyMachineInstruction(
  config: CandyMachineConfig
): Promise<CandyMachineInstructionData> {
  const rpcEndpoint = config.network === 'mainnet-beta'
    ? 'https://api.mainnet-beta.solana.com'
    : 'https://api.devnet.solana.com'

  // Create Umi instance and register the Core Candy Machine program
  const umi = createUmi(rpcEndpoint).use(mplCandyMachine())

  // Set a noop signer as identity (canister will do the actual signing)
  const canisterPayer = umiPublicKey(config.canisterPayerAddress)
  const noopSigner = createNoopSigner(canisterPayer)
  umi.use(signerIdentity(noopSigner))

  if (!config.candyMachineAddress) {
    throw new Error('candyMachineAddress is required')
  }

  // Use the derived candy machine address from the canister
  const candyMachineSigner = createNoopSigner(umiPublicKey(config.candyMachineAddress))

  // For now, use a placeholder collection (system program)
  // In production, this should be the actual collection mint
  const collectionMint = umiPublicKey('11111111111111111111111111111111')

  // Build create instruction (without blockhash)
  const createIx = await create(umi, {
    candyMachine: candyMachineSigner,
    collection: collectionMint,
    collectionUpdateAuthority: umi.identity,
    itemsAvailable: config.supply,
    authority: umi.identity,
    isMutable: true,
    configLineSettings: some({
      prefixName: `${config.name} #`,
      nameLength: 32,
      prefixUri: config.manifestUrl,
      uriLength: 200,
      isSequential: true,
    }),
    guards: {
      solPayment: some({
        lamports: sol(config.mintPrice),
        destination: canisterPayer,
      }),
      startDate: config.goLiveDate ? some({
        date: dateTime(config.goLiveDate)
      }) : undefined,
    },
  })

  // The createIx is a TransactionBuilder, we need to extract the instruction
  // Build it to get the items
  const items = createIx.getInstructions()

  // Get the first (and should be only) instruction
  const instruction = items[0]

  // Convert accounts to serializable format
  const forcedSignerOrder = [
    config.canisterPayerAddress,
    config.candyMachineAddress,
  ]
  let nextSignerIndex = 0

  const accounts = instruction.keys.map((key: AccountMeta) => {
    let pubkeyString = key.pubkey.toString()
    let isSigner = key.isSigner

    if (key.isSigner) {
      const forcedPubkey =
        forcedSignerOrder[nextSignerIndex] ?? config.canisterPayerAddress
      pubkeyString = forcedPubkey
      isSigner = true
      nextSignerIndex = Math.min(nextSignerIndex + 1, forcedSignerOrder.length)
    }

    return {
      pubkey: pubkeyString,
      isSigner,
      isWritable: key.isWritable,
    }
  })

  if (process.env.NODE_ENV !== 'production') {
    console.log('Candy Machine create instruction accounts:', accounts)
  }

  return {
    programId: instruction.programId.toString(),
    accounts,
    data: instruction.data,
  }
}

/**
 * Creates authority transfer instruction (TODO: implement when needed)
 */
export async function createTransferAuthorityInstruction(
  candyMachineAddress: string,
  canisterPayerAddress: string,
  userWalletAddress: string,
  network?: 'devnet' | 'mainnet-beta'
): Promise<CandyMachineInstructionData> {
  // TODO: Implement authority transfer instruction
  throw new Error('Transfer authority instruction not yet implemented')
}

/**
 * Calls the canister to build, sign and send the Candy Machine creation transaction
 * The canister will:
 * 1. Receive the instruction data
 * 2. Fetch recent blockhash using estimate_recent_blockhash
 * 3. Build the complete transaction message
 * 4. Sign with canister's Solana wallet
 * 5. Send to Solana network
 */
export async function deployCandyMachineViaCanister(
  actor: any,
  collectionId: string,
  instructionData: CandyMachineInstructionData
): Promise<string> {
  try {
    const result = await actor.create_candy_machine_from_instruction(
      collectionId,
      {
        program_id: instructionData.programId,
        accounts: instructionData.accounts.map(acc => ({
          pubkey: acc.pubkey,
          is_signer: acc.isSigner,
          is_writable: acc.isWritable,
        })),
        data: Array.from(instructionData.data),
      }
    )

    if ('Err' in result) {
      throw new Error(result.Err)
    }

    return result.Ok // Transaction signature
  } catch (error) {
    console.error('Failed to deploy candy machine:', error)
    throw error
  }
}
