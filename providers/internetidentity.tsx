import { AuthClient } from "@dfinity/auth-client";
import { iiURL } from "../constants/urls";
import { WalletType } from "./types";


const loginOptions = {
  identityProvider: iiURL
};

const connectInternetIdentityWallet = async (callback : any) => {
  const authClient = await AuthClient.create();

  const onConnectCallback = async () => {
    if (await authClient.isAuthenticated()) {
      callback(true, WalletType.InternetIdentity);
    }
    callback(false, null);
  };

  authClient.login({
    ...loginOptions,
    onSuccess: () => {
      onConnectCallback();
    },
  });
};

export { connectInternetIdentityWallet };
