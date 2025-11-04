import {
  MARKETPLACE_SERVICE,
  marketplaceCanisterId,
  marketplaceIDL,
} from "@/constants/canisters-config";
import { host, network } from "@/constants/urls";
import { Actor, ActorSubclass, HttpAgent } from "@dfinity/agent";

export const getMarketplaceActor = async (
  identity: any
): Promise<ActorSubclass<MARKETPLACE_SERVICE>> => {
  const agent = await HttpAgent.create({
    host: host,
    identity,
  });

  if (network === "local") {
    agent.fetchRootKey().catch((err) => {
      console.log("Error fetching root key: ", err);
    });
  }

  const canister = Actor.createActor<MARKETPLACE_SERVICE>(marketplaceIDL, {
    agent,
    canisterId: marketplaceCanisterId,
  });
  return canister;
};
