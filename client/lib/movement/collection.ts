import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

export interface CreateCollectionParams {
  creatorAddress: any; // AccountAddress or string
  name: string;
  symbol: string;
  description: string;
  uri: string;
  maxSupply?: number; // undefined = unlimited
  royaltyPercentage: number; // e.g., 5 for 5%
  network?: "testnet" | "mainnet";
}

export interface MintTokenParams {
  creatorAddress: string;
  collectionName: string;
  description: string;
  name: string;
  uri: string;
  recipient: string;
  network?: "testnet" | "mainnet";
}

const MODULE_ADDRESS = "0x445516c4b4caba7ff0e233b029d57f65b63309b46cb4cd468e55353e52090fb1";
const MODULE_NAME = "nft_collection";

// Movement network configurations
const MOVEMENT_CONFIGS = {
  mainnet: {
    chainId: 126,
    fullnode: "https://mainnet.movementnetwork.xyz/v1",
  },
  testnet: {
    chainId: 250,
    fullnode: "https://testnet.movementnetwork.xyz/v1",
  }
};

function getAptosConfig(network: "testnet" | "mainnet" = "testnet"): AptosConfig {
  const config = MOVEMENT_CONFIGS[network];
  return new AptosConfig({
    network: Network.CUSTOM,
    fullnode: config.fullnode,
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
  } = params;

  // Convert royalty percentage to numerator/denominator (e.g., 5% = 5/100)
  const royaltyNumerator = Math.floor(royaltyPercentage);
  const royaltyDenominator = 100;

  // For Option<u64> in Move with TS SDK:
  // - Pass the value directly for Some
  // - Pass undefined/null for None (SDK will encode as empty option)
  const maxSupplyArg = maxSupply !== undefined && maxSupply !== null
    ? maxSupply
    : undefined;

  console.log("Building payload with:", {
    description,
    name,
    uri,
    maxSupply: maxSupplyArg,
    royaltyNumerator,
    royaltyDenominator,
  });

  return {
    sender: creatorAddress,
    data: {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::create_collection`,
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
  } = params;

  return {
    sender: creatorAddress,
    data: {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::mint_token`,
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
  network: "testnet" | "mainnet" = "testnet"
): Promise<string> {
  const config = getAptosConfig(network);
  const aptos = new Aptos(config);

  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_collection_address`,
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
  network: "testnet" | "mainnet" = "testnet"
): Promise<boolean> {
  const config = getAptosConfig(network);
  const aptos = new Aptos(config);

  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::${MODULE_NAME}::collection_exists`,
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
