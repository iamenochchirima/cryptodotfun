// Candy Machine V3 (Token Metadata) - Updated to match working implementation
import { addConfigLines, create, mplCandyMachine } from '@metaplex-foundation/mpl-candy-machine'
import {
  mplTokenMetadata,
  TokenStandard,
  createNft,
} from '@metaplex-foundation/mpl-token-metadata'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import {
  publicKey as umiPublicKey,
  some,
  sol,
  dateTime,
  createNoopSigner,
  signerIdentity,
  AccountMeta,
  percentAmount,
  generateSigner,
} from '@metaplex-foundation/umi'

export interface CollectionNFTConfig {
  name: string
  uri: string // Collection metadata URI
  royaltyBps: number
  collectionMintAddress: string // Pre-derived from canister
  canisterPayerAddress: string // The canister's Solana address (will be authority)
  network?: 'devnet' | 'mainnet-beta'
}

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
  collectionMintAddress: string // The derived collection mint address
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

export interface CandyMachineConfigLine {
  name: string
  uri: string
}

/**
 * Creates Collection NFT instruction data
 * This MUST be executed BEFORE creating the Candy Machine
 * The canister will:
 * - Fetch recent blockhash
 * - Build and sign the transaction
 * - Send to Solana with 'finalized' commitment
 */
export async function createCollectionNFTInstruction(
  config: CollectionNFTConfig
): Promise<CandyMachineInstructionData[]> {
  const rpcEndpoint = config.network === 'mainnet-beta'
    ? 'https://api.mainnet-beta.solana.com'
    : 'https://api.devnet.solana.com'

  // Create Umi instance with Token Metadata plugin
  const umi = createUmi(rpcEndpoint)
    .use(mplTokenMetadata())

  // Set canister as the authority (noop signer since canister will sign)
  const canisterPayer = umiPublicKey(config.canisterPayerAddress)
  const noopSigner = createNoopSigner(canisterPayer)
  umi.use(signerIdentity(noopSigner))

  // Use the pre-derived collection mint address from canister
  const collectionMintSigner = createNoopSigner(umiPublicKey(config.collectionMintAddress))

  console.log('Creating Collection NFT instruction:')
  console.log('  Collection Mint:', config.collectionMintAddress)
  console.log('  Authority (Canister):', config.canisterPayerAddress)
  console.log('  Name:', config.name)
  console.log('  URI:', config.uri)

  // Build Collection NFT creation instruction
  const createNftIx = createNft(umi, {
    mint: collectionMintSigner,
    authority: umi.identity,
    name: config.name,
    uri: config.uri,
    sellerFeeBasisPoints: percentAmount(config.royaltyBps / 100, 2),
    isCollection: true,
    collectionDetails: {
      __kind: 'V1',
      size: 0,
    },
  })

  const items = createNftIx.getInstructions()

  console.log('\n=== Collection NFT Instruction Analysis ===')
  console.log('Expected addresses:')
  console.log('  Collection Mint:', config.collectionMintAddress)
  console.log('  Canister Payer:', config.canisterPayerAddress)

  return items.map((instruction, ixIndex) => {
    console.log(`\nInstruction ${ixIndex} original accounts:`)
    instruction.keys.forEach((key: AccountMeta, idx) => {
      console.log(`  [${idx}] ${key.pubkey.toString()}`)
      console.log(`      Original isSigner: ${key.isSigner}, isWritable: ${key.isWritable}`)
    })

    const accounts = instruction.keys.map((key: AccountMeta) => {
      const pubkeyStr = key.pubkey.toString()
      const isCollectionMint = pubkeyStr === config.collectionMintAddress
      const isPayer = pubkeyStr === config.canisterPayerAddress

      // IMPORTANT: Only mark canister-controlled accounts as signers
      // The canister can only sign for the payer and collection mint
      // Other accounts (metadata PDAs, etc.) should NOT be signers
      const isSigner = isCollectionMint || isPayer

      // Ensure collection mint and payer are writable
      const isWritable = key.isWritable || isCollectionMint || isPayer

      if (isSigner) {
        console.log(`  ✓ Marking as signer: ${pubkeyStr} (${isCollectionMint ? 'CollectionMint' : 'Payer'})`)
      }

      return {
        pubkey: pubkeyStr,
        isSigner,
        isWritable,
      }
    })

    console.log(`\nFinal instruction ${ixIndex}:`, {
      programId: instruction.programId.toString(),
      accountCount: accounts.length,
      signers: accounts.filter(a => a.isSigner).map(a => a.pubkey),
      dataLength: instruction.data ? instruction.data.length : 0,
    })

    if (!instruction.data || instruction.data.length === 0) {
      throw new Error(`Instruction ${ixIndex} has no data`)
    }

    return {
      programId: instruction.programId.toString(),
      accounts,
      data: instruction.data,
    }
  })
}

/**
 * Creates Candy Machine instruction data
 * This instruction data will be sent to the canister which will:
 * - Fetch recent blockhash using estimate_recent_blockhash
 * - Build the complete transaction message
 * - Sign and send to Solana
 *
 * IMPORTANT: Collection NFT MUST be created first!
 */
export async function createCandyMachineInstruction(
  config: CandyMachineConfig
): Promise<CandyMachineInstructionData[]> {
  const rpcEndpoint = config.network === 'mainnet-beta'
    ? 'https://api.mainnet-beta.solana.com'
    : 'https://api.devnet.solana.com'

  // Create Umi instance with Token Metadata and Candy Machine V3 plugins
  const umi = createUmi(rpcEndpoint)
    .use(mplTokenMetadata())
    .use(mplCandyMachine())

  // Set a noop signer as identity (canister will do the actual signing)
  const canisterPayer = umiPublicKey(config.canisterPayerAddress)
  const noopSigner = createNoopSigner(canisterPayer)
  umi.use(signerIdentity(noopSigner))

  if (!config.candyMachineAddress) {
    throw new Error('candyMachineAddress is required')
  }

  // Use the derived candy machine address from the canister
  const candyMachineSigner = createNoopSigner(umiPublicKey(config.candyMachineAddress))

  // Use the derived collection mint address from the canister
  const collectionMint = umiPublicKey(config.collectionMintAddress)

  // Build Candy Machine V3 create instruction (without blockhash)
  const createIx = await create(umi, {
    candyMachine: candyMachineSigner,
    collectionMint: collectionMint,
    collectionUpdateAuthority: umi.identity,
    tokenStandard: TokenStandard.NonFungible,
    sellerFeeBasisPoints: percentAmount(config.royaltyBps / 100, 2),
    itemsAvailable: config.supply,
    symbol: config.symbol,
    maxEditionSupply: 0,
    isMutable: true,
    creators: [
      {
        address: umi.identity.publicKey,
        verified: true,
        percentageShare: 100,
      },
    ],
    configLineSettings: some({
      prefixName: '',
      nameLength: 32,
      prefixUri: '',
      uriLength: 200,
      isSequential: false,
    }),
    guards: {
      solPayment: some({
        lamports: sol(config.mintPrice),
        destination: canisterPayer,
      }),
      startDate: config.goLiveDate ? some({
        date: dateTime(config.goLiveDate)
      }) : some({ date: dateTime(new Date().toISOString()) }),
    },
  })

  const items = createIx.getInstructions()

  return items.map((instruction, ixIndex) => {
    // Ensure critical accounts are marked as writable
    const accounts = instruction.keys.map((key: AccountMeta) => {
      const pubkeyStr = key.pubkey.toString()
      const isCandyMachine = pubkeyStr === config.candyMachineAddress
      const isPayer = pubkeyStr === config.canisterPayerAddress
      const isCollection = pubkeyStr === config.collectionMintAddress

      // IMPORTANT: Only mark canister-controlled accounts as signers
      // The canister can only sign for the payer and candy machine
      // Collection mint should already exist (not a signer here)
      const isSigner = isCandyMachine || isPayer

      // Force candy machine, payer, and collection to be writable
      const isWritable = key.isWritable || isCandyMachine || isPayer || isCollection

      return {
        pubkey: pubkeyStr,
        isSigner,
        isWritable,
      }
    })

    console.log(`Candy Machine create instruction ${ixIndex}:`, {
      programId: instruction.programId.toString(),
      accounts,
      dataLength: instruction.data ? instruction.data.length : 0,
      hasData: !!instruction.data
    })

    if (!instruction.data || instruction.data.length === 0) {
      throw new Error(`Instruction ${ixIndex} has no data - this should not happen with Metaplex instructions`)
    }

    return {
      programId: instruction.programId.toString(),
      accounts,
      data: instruction.data,
    }
  })
}

export interface AddConfigLinesParams {
  canisterPayerAddress: string
  candyMachineAddress: string
  startIndex: number
  items: CandyMachineConfigLine[]
  network?: 'devnet' | 'mainnet-beta'
}

export async function buildAddConfigLinesInstruction(
  params: AddConfigLinesParams
): Promise<CandyMachineInstructionData> {
  if (!params.items.length) {
    throw new Error('No config lines provided')
  }

  const rpcEndpoint = params.network === 'mainnet-beta'
    ? 'https://api.mainnet-beta.solana.com'
    : 'https://api.devnet.solana.com'

  // Use Token Metadata and Candy Machine V3 plugins
  const umi = createUmi(rpcEndpoint)
    .use(mplTokenMetadata())
    .use(mplCandyMachine())

  const canisterPayer = umiPublicKey(params.canisterPayerAddress)
  const noopSigner = createNoopSigner(canisterPayer)
  umi.use(signerIdentity(noopSigner))

  const builder = await addConfigLines(umi, {
    candyMachine: umiPublicKey(params.candyMachineAddress),
    authority: umi.identity,
    index: params.startIndex,
    configLines: params.items.map(item => ({
      name: item.name,
      uri: item.uri,
    })),
  })

  const instruction = builder.getInstructions()[0]

  // Keep original ordering/writability; just ensure the two accounts we control are marked as signers
  const accounts = instruction.keys.map((key: AccountMeta) => {
    const pubkeyString = key.pubkey.toString()
    const isCandyMachine = pubkeyString === params.candyMachineAddress
    const isPayer = pubkeyString === params.canisterPayerAddress

    // IMPORTANT: Only mark canister-controlled accounts as signers
    const isSigner = isCandyMachine || isPayer
    const isWritable = key.isWritable || isCandyMachine

    return {
      pubkey: pubkeyString,
      isSigner,
      isWritable,
    }
  })

  console.log('Add config lines instruction:', {
    programId: instruction.programId.toString(),
    accounts,
    dataLength: instruction.data ? instruction.data.length : 0,
    hasData: !!instruction.data
  })

  if (!instruction.data || instruction.data.length === 0) {
    throw new Error('addConfigLines instruction has no data - this should not happen with Metaplex instructions')
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
  instructions: CandyMachineInstructionData[]
): Promise<string> {
  try {
    // Validate and prepare instructions
    const preparedInstructions = instructions.map((ix, index) => {
      if (!ix.data) {
        console.error(`Instruction ${index} is missing data field:`, ix)
        throw new Error(`Instruction ${index} is missing required 'data' field`)
      }
      
      if (!ix.programId) {
        console.error(`Instruction ${index} is missing programId field:`, ix)
        throw new Error(`Instruction ${index} is missing required 'programId' field`)
      }

      return {
        program_id: ix.programId,
        accounts: ix.accounts.map(acc => ({
          pubkey: acc.pubkey,
          is_signer: acc.isSigner,
          is_writable: acc.isWritable,
        })),
        data: ix.data, 
      }
    })

    console.log('Sending instructions to canister:', preparedInstructions)

    const result = await actor.create_candy_machine_from_instruction(
      collectionId,
      preparedInstructions
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
