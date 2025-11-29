import { addConfigLines, create, mplCandyMachine } from '@metaplex-foundation/mpl-core-candy-machine'
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
 * Creates Candy Machine instruction data
 * This instruction data will be sent to the canister which will:
 * - Fetch recent blockhash using estimate_recent_blockhash
 * - Build the complete transaction message
 * - Sign and send to Solana
 */
export async function createCandyMachineInstruction(
  config: CandyMachineConfig
): Promise<CandyMachineInstructionData[]> {
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

  // Use the derived collection mint address from the canister
  const collectionMint = umiPublicKey(config.collectionMintAddress)

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

  const items = createIx.getInstructions()

  return items.map((instruction, ixIndex) => {
    // Ensure critical accounts are marked as writable
    const accounts = instruction.keys.map((key: AccountMeta) => {
      const pubkeyStr = key.pubkey.toString()
      const isCandyMachine = pubkeyStr === config.candyMachineAddress
      const isPayer = pubkeyStr === config.canisterPayerAddress
      const isCollection = pubkeyStr === config.collectionMintAddress

      // Force candy machine, payer, and collection to be writable
      const isWritable = key.isWritable || isCandyMachine || isPayer || isCollection

      return {
        pubkey: pubkeyStr,
        isSigner: key.isSigner,
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

  const umi = createUmi(rpcEndpoint).use(mplCandyMachine())

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

    const isSigner = key.isSigner || isCandyMachine || isPayer
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
