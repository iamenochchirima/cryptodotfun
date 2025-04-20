const canisterId = "rwlgt-iiaaa-aaaaa-aaaaa-cai";

export const network = process.env.DFX_NETWORK || "local";

console.log("Network: ", network);

export const host =
  network === "local" ? "http://localhost:4943" : "https://icp0.io";

export const iiURL =
  network === "local"
    ? `http://${canisterId}.localhost:4943/#authorize`
    : "https://identity.ic0.app/#authorize";
