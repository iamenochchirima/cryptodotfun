// providers/eth/wagmi/wagmi.config.ts
import { createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { walletConnect } from "wagmi/connectors";

// Replace with your own WalletConnect project ID
const WALLETCONNECT_PROJECT_ID = "3936b3795b20eea5fe9282a3a80be958";

function getConnectors() {
  const connectors = [];
  
  // Only initialize connectors on client side
  if (typeof window !== 'undefined') {
    connectors.push(
      walletConnect({ 
        projectId: WALLETCONNECT_PROJECT_ID,
        metadata: {
          name: 'Your App Name',
          description: 'Your App Description',
          url: window.location.origin,
          icons: ['https://your-app-icon.com/icon.png']
        }
      })
    );
  }
  
  return connectors;
}

export const wagmiConfig = createConfig({
  chains: [mainnet],
  connectors: getConnectors(),
  transports: {
    [mainnet.id]: http(),
  },
  ssr: true,
});