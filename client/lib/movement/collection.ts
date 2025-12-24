import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { MOVEMENT_CONTRACTS, MOVEMENT_NETWORK, type MovementNetwork } from "@/constants/movement";

export interface CreateCollectionParams {
  creatorAddress: any;
  name: string;
  symbol: string;
  description: string;
  uri: string;
  maxSupply?: number;
  royaltyPercentage: number;
  network?: MovementNetwork;
}

export interface MintTokenParams {
  creatorAddress: string;
  collectionName: string;
  description: string;
  name: string;
  uri: string;
  recipient: string;
  network?: MovementNetwork;
}

function getAptosConfig(network: MovementNetwork = "testnet"): AptosConfig {
  const config = MOVEMENT_NETWORK[network];
  return new AptosConfig({
    network: Network.CUSTOM,
    fullnode: config.rpcUrl,
  });
}

export function buildCreateCollectionPayload(params: CreateCollectionParams) {
  const {
    creatorAddress,
    name,
    description,
    uri,
    maxSupply,
    royaltyPercentage,
    network = "testnet",
  } = params;

  const royaltyNumerator = Math.floor(royaltyPercentage);
  const royaltyDenominator = 100;

  const maxSupplyArg = maxSupply !== undefined && maxSupply !== null
    ? maxSupply
    : undefined;

  const contract = MOVEMENT_CONTRACTS[network].launchpad;

  return {
    sender: creatorAddress,
    data: {
      function: `${contract.address}::${contract.module}::create_collection`,
      functionArguments: [
        description,
        name,
        uri,
        maxSupplyArg,
        royaltyNumerator,
        royaltyDenominator,
      ],
    },
  };
}

export function buildMintTokenPayload(params: MintTokenParams) {
  const {
    creatorAddress,
    collectionName,
    description,
    name,
    uri,
    recipient,
    network = "testnet",
  } = params;

  const contract = MOVEMENT_CONTRACTS[network].launchpad;

  return {
    sender: creatorAddress,
    data: {
      function: `${contract.address}::${contract.module}::mint_token`,
      functionArguments: [
        collectionName,
        description,
        name,
        uri,
        recipient,
      ],
    },
  };
}

export async function getCollectionAddress(
  creatorAddress: string,
  collectionName: string,
  network: MovementNetwork = "testnet"
): Promise<string> {
  const config = getAptosConfig(network);
  const aptos = new Aptos(config);
  const contract = MOVEMENT_CONTRACTS[network].launchpad;

  try {
    const result = await aptos.view({
      payload: {
        function: `${contract.address}::${contract.module}::get_collection_address`,
        typeArguments: [],
        functionArguments: [creatorAddress, collectionName],
      },
    });

    return result[0] as string;
  } catch (error) {
    console.error("Failed to get collection address:", error);
    throw error;
  }
}

export async function collectionExists(
  creatorAddress: string,
  collectionName: string,
  network: MovementNetwork = "testnet"
): Promise<boolean> {
  const config = getAptosConfig(network);
  const aptos = new Aptos(config);
  const contract = MOVEMENT_CONTRACTS[network].launchpad;

  try {
    const result = await aptos.view({
      payload: {
        function: `${contract.address}::${contract.module}::collection_exists`,
        typeArguments: [],
        functionArguments: [creatorAddress, collectionName],
      },
    });

    return result[0] as boolean;
  } catch (error) {
    console.error("Failed to check collection existence:", error);
    return false;
  }
}
