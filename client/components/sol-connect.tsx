import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import React from 'react'
import ConnectButton from './sol-connect-button';
import SignInButton from './sol-sign-in-button';

const SolConnect = () => {

    return (
        <div>
            <ConnectButton />
            <SignInButton />
        </div>
    )
}

export default SolConnect
