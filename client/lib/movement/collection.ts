import { Aptos, AptosConfig, Network, InputGenerateTransactionPayloadData } from "@aptos-labs/ts-sdk";

export interface CreateCollectionParams {
  creatorAddress: string;
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

function getAptosConfig(network: "testnet" | "mainnet" = "testnet"): AptosConfig {
  if (network === "mainnet") {
    return new AptosConfig({
      network: Network.MAINNET,
      fullnode: "https://fullnode.mainnet.movementnetwork.xyz/v1",
    });
  }
  // Testnet configuration
  return new AptosConfig({
    network: Network.TESTNET,
    fullnode: "https://aptos.testnet.porto.movementlabs.xyz/v1",
  });
}

export function buildCreateCollectionPayload(params: CreateCollectionParams): InputGenerateTransactionPayloadData {
  const {
    name,
    description,
    uri,
    maxSupply,
    royaltyPercentage,
  } = params;

  // Convert royalty percentage to numerator/denominator (e.g., 5% = 5/100)
  const royaltyNumerator = royaltyPercentage;
  const royaltyDenominator = 100;

  // Build max_supply Option type
  const maxSupplyArg = maxSupply !== undefined ? [maxSupply.toString()] : [];

  return {
    function: `${MODULE_ADDRESS}::${MODULE_NAME}::create_collection`,
    typeArguments: [],
    functionArguments: [
      description,
      name,
      uri,
      maxSupplyArg,
      royaltyNumerator.toString(),
      royaltyDenominator.toString(),
    ],
  };
}

export function buildMintTokenPayload(params: MintTokenParams): InputGenerateTransactionPayloadData {
  const {
    collectionName,
    description,
    name,
    uri,
    recipient,
  } = params;

  return {
    function: `${MODULE_ADDRESS}::${MODULE_NAME}::mint_token`,
    typeArguments: [],
    functionArguments: [
      collectionName,
      description,
      name,
      uri,
      recipient,
    ],
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
