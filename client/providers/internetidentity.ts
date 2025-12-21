"use client";
import { AuthClient } from "@dfinity/auth-client";
import { WalletType } from "./types";
import { getIIURL } from "@/constants/urls";

const MAX_TTL = BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000); // 7 days in nanoseconds

const loginOptions = {
  identityProvider: getIIURL(),
  maxTimeToLive: MAX_TTL,
  // Add derivationOrigin for id.ai to work correctly
  derivationOrigin: typeof window !== 'undefined' ? window.location.origin : undefined,
};

const connectInternetIdentityWallet = async (callback : any) => {
  const authClient = await AuthClient.create();

  const onConnectCallback = async () => {
    if (await authClient.isAuthenticated()) {
      callback(true, WalletType.InternetIdentity);
    } else {
      callback(false, null);
    }
  };

  authClient.login({
    ...loginOptions,
    onSuccess: () => {
      onConnectCallback();
    },
    onError: (error) => {
      console.error("Internet Identity login error:", error);
      callback(false, null);
    },
  });
};

export { connectInternetIdentityWallet };
