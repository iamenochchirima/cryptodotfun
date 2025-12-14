"use client";

import { ReactNode } from "react";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { AptosConfig, Network } from "@aptos-labs/ts-sdk";

interface MovementProviderProps {
  children: ReactNode;
}

export function MovementProvider({ children }: MovementProviderProps) {
  // Movement Mainnet configuration
  const aptosConfig = new AptosConfig({
    network: Network.MAINNET,
    fullnode: "https://full.mainnet.movementinfra.xyz/v1",
  });

  return (
    <AptosWalletAdapterProvider
      autoConnect={false}
      dappConfig={aptosConfig}
      onError={(error) => {
        console.error("Movement wallet error:", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
