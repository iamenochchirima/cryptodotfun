import { Actor, HttpAgent } from "@dfinity/agent";
import { Ed25519KeyIdentity } from "@dfinity/identity";
import { Secp256k1KeyIdentity } from "@dfinity/identity-secp256k1";
import { idlFactory } from "../../../canisters/src/declarations/identity_certifier/identity_certifier.did.js";
import type { _SERVICE } from "../../../canisters/src/declarations/identity_certifier/identity_certifier.did.js";
import { Principal } from "@dfinity/principal";
import { funCanisterId } from "./constants";

export let getActor = async (network: string) => {
  let host = network == "ic" ? "https://icp0.io" : "http://127.0.0.1:4943";

  if (network === "local" || network === "test") {
    host = "http://127.0.0.1:4943";
  } else {
    host = "https://icp0.io";
  }
  
  const mnemonic = process.env.KEY || "";

  const identity = Secp256k1KeyIdentity.fromSeedPhrase(mnemonic);

  let agent = await HttpAgent.create({ host, identity });
  if (network == "local") {
    agent.fetchRootKey();
  }

  return Actor.createActor<_SERVICE>(idlFactory, {
    agent: agent,
    canisterId: funCanisterId,
  });
};

export const getTokenIdentifier = (
  canister: Principal,
  index: number
): string => {
  const padding = Buffer.from("\x0Atid");
  const array = new Uint8Array([
    ...padding,
    ...canister.toUint8Array(),
    ...to32bits(index),
  ]);
  return Principal.fromUint8Array(array).toText();
};

export const to32bits = (num: number): number[] => {
  const b = new ArrayBuffer(4);
  new DataView(b).setUint32(0, num);
  return Array.from(new Uint8Array(b));
};
