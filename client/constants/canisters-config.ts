export { idlFactory as icSiwsIDL } from "../../canisters/src/declarations/ic_siws_provider/ic_siws_provider.did.js";
export { idlFactory as icSiweIDL } from "../../canisters/src/declarations/ic_siwe_provider/ic_siwe_provider.did.js";
export { idlFactory as usersIDL } from "../../canisters/src/declarations/users/users.did.js";

import prodConfig from '../../canisters/canister_ids.json';
import localConfig from '../../canisters/.dfx/local/canister_ids.json';

// Define network locally to avoid circular dependency
const network = process.env.NEXT_PUBLIC_ENVIRONMENT || "local";

export

interface CanisterConfigType {
  [key: string]: {
    [env: string]: string;
  };
}


export function getCanisterId(key: string): string {
  if (network === "ic") {
    const config: CanisterConfigType = prodConfig;
    if (config[key]) {
      return config[key]['ic'];
    } else {
      console.error(`Canister ID for key "${key}" not found.`);
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
  internetIdentityCanisterId: string;
}

const productionCanisters: CanisterConfig = {
  usersCanisterId: getCanisterId('users'),
  icSiweProviderCanisterId: getCanisterId('ic_siwe_provider'),
  icSiwsProviderCanisterId: getCanisterId('ic_siws_provider'),
  internetIdentityCanisterId: getCanisterId('internet_identity'),
};

const localCanisters: CanisterConfig = {
  usersCanisterId: getCanisterId('users'),
  icSiweProviderCanisterId: getCanisterId('ic_siwe_provider'),
  icSiwsProviderCanisterId: getCanisterId('ic_siws_provider'),
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
  internetIdentityCanisterId,
} = canisterConfigs[network as Env];