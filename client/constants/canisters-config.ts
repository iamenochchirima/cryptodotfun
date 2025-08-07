export { idlFactory as icSiwsIDL } from "../idls/ic_siws_provider/ic_siws_provider.did.js";
export { idlFactory as icSiweIDL } from "../idls/ic_siwe_provider/ic_siwe_provider.did.js";
export { idlFactory as icSiwbIDL } from "../idls/ic_siwb_provider/ic_siwb_provider.did.js";
export { idlFactory as usersIDL } from "../idls/users/users.did.js";

// Define network locally to avoid circular dependency
const network = process.env.NEXT_PUBLIC_ENVIRONMENT || "local";

interface CanisterConfigType {
  [key: string]: {
    [env: string]: string;
  };
}

// Dynamic imports to handle missing files
let prodConfig: CanisterConfigType = {};
let localConfig: CanisterConfigType = {};

try {
  prodConfig = require('../../canisters/canister_ids.json');
} catch (error) {
  console.warn('Production canister config not found, using fallback');
}

try {
  if (network === "local") {
    localConfig = require('../../canisters/.dfx/local/canister_ids.json');
  }
} catch (error) {
  console.warn('Local canister config not found, using fallback');
}

export function getCanisterId(key: string): string {
  if (network === "ic") {
    const config: CanisterConfigType = prodConfig;
    if (config[key]) {
      return config[key]['ic'];
    } else {
      console.error(`Canister ID for key "${key}" not found in production config.`);
      return "";
    }
  } else {
    const config: CanisterConfigType = localConfig;
    if (config[key]) {
      return config[key]['local'];
    } else {
      console.error(`Canister ID for key "${key}" not found in local configuration.`);
      return "";
    }
  }
}

type Env = "ic" | "local";


interface CanisterConfig {
  usersCanisterId: string;
  icSiweProviderCanisterId: string;
  icSiwsProviderCanisterId: string;
  icSiwbProviderCanisterId: string;
  internetIdentityCanisterId: string;

}

const productionCanisters: CanisterConfig = {
  usersCanisterId: getCanisterId('users'),
  icSiweProviderCanisterId: getCanisterId('ic_siwe_provider'),
  icSiwsProviderCanisterId: getCanisterId('ic_siws_provider'),
  icSiwbProviderCanisterId: getCanisterId('ic_siwb_provider'),
  internetIdentityCanisterId: getCanisterId('internet_identity'),
};

const localCanisters: CanisterConfig = {
  usersCanisterId: getCanisterId('users'),
  icSiweProviderCanisterId: getCanisterId('ic_siwe_provider'),
  icSiwsProviderCanisterId: getCanisterId('ic_siws_provider'),
  icSiwbProviderCanisterId: getCanisterId('ic_siwb_provider'),
  internetIdentityCanisterId: getCanisterId('internet_identity'),
};

const canisterConfigs: Record<Env, CanisterConfig> = {
  ic:  productionCanisters,
  local: localCanisters,
};

export const {
  usersCanisterId,
  icSiweProviderCanisterId,
  icSiwsProviderCanisterId,
  icSiwbProviderCanisterId,
  internetIdentityCanisterId,
} = canisterConfigs[network as Env];