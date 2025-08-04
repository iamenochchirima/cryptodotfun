export const network = process.env.NEXT_PUBLIC_ENVIRONMENT || "local";

export const host =
  network === "local" ? "http://localhost:4943" : "https://icp0.io";

export const getIIURL = (): string => {

  const { internetIdentityCanisterId } = require("./canisters-config");
  
  return network === "local"
    ? `http://${internetIdentityCanisterId}.localhost:4943/#authorize`
    : "https://identity.ic0.app/#authorize";
};


export const iiURL = getIIURL();
