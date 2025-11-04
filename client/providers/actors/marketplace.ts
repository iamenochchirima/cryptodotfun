import { MARKETPLACE_SERVICE, marketplaceCanisterId, marketplaceIDL } from "@/constants/canisters-config";
import { host } from "@/constants/urls";
import { Actor, ActorSubclass, HttpAgent } from "@dfinity/agent";
import { promises } from "dns";

export const getMarketplaceActor = async (identity : any) : Promise<ActorSubclass<MARKETPLACE_SERVICE>>  => {
  const agent = await HttpAgent.create({
    host: host,
    identity
  });

  const canister = Actor.createActor<MARKETPLACE_SERVICE>(marketplaceIDL, {
    agent,
    canisterId: marketplaceCanisterId,
  });
  return canister;
};
