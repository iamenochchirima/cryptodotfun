// DeployStage.tsx - Candy Machine V3 (Token Metadata)
// Based on: https://developers.metaplex.com/candy-machine/manage
// 
// Required packages:
// npm install @metaplex-foundation/mpl-candy-machine@latest
// npm install @metaplex-foundation/mpl-token-metadata@latest
// npm install @metaplex-foundation/umi@latest
// npm install @metaplex-foundation/umi-bundle-defaults@latest
// npm install @metaplex-foundation/umi-signer-wallet-adapters@latest

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import {
  createNft,
  mplTokenMetadata,
  TokenStandard,
  fetchDigitalAsset,
} from '@metaplex-foundation/mpl-token-metadata'
import {
  create,
  mplCandyMachine,
} from '@metaplex-foundation/mpl-candy-machine'
import {
  generateSigner,
  percentAmount,
  some,
  sol,
  dateTime,
} from '@metaplex-foundation/umi'
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters'
import { saveCandyMachine } from '@/lib/candy-machine-db'

const TEST_MANIFEST_URL = 'https://teal-random-dingo-514.mypinata.cloud/ipfs/bafkreibiklbh7i7kmjwqgr3w2hqgakscgkm2nyb2cgnatuj47xvcqxtzxq'

interface DeployStageProps {
  onDeploySuccess: (candyMachineId: string) => void
}

export function DeployStage({ onDeploySuccess }: DeployStageProps) {
  const { publicKey, signTransaction, signAllTransactions, connected } = useWallet()
  const [deploying, setDeploying] = useState(false)
  const [step, setStep] = useState('')

  // Form data
  const [name, setName] = useState('Test Collection')
  const [symbol, setSymbol] = useState('TEST')
  const [supply, setSupply] = useState('29')
  const [mintPrice, setMintPrice] = useState('0.01')
  const [royalties, setRoyalties] = useState('5') // percentage

  const handleDeploy = async () => {
    if (!connected || !publicKey || !signTransaction || !signAllTransactions) {
      toast.error('Please connect your wallet')
      return
    }

    try {
      setDeploying(true)
      const candyMachineId = `cm-${Date.now()}`

      setStep('Initializing UMI...')

      // Create UMI instance with Token Metadata and Candy Machine plugins
      const umi = createUmi('https://api.devnet.solana.com')
        .use(walletAdapterIdentity({ publicKey, signTransaction, signAllTransactions }))
        .use(mplTokenMetadata())
        .use(mplCandyMachine())

      // Confirmation options - IMPORTANT: use 'finalized' for collection NFT
      // This ensures the account is fully available before Candy Machine uses it
      const finalizedOptions = {
        send: { commitment: 'finalized' as const },
        confirm: { commitment: 'finalized' as const },
      }
      
      const confirmOptions = {
        send: { commitment: 'confirmed' as const },
        confirm: { commitment: 'confirmed' as const },
      }

      setStep('Generating keypairs...')

      const candyMachine = generateSigner(umi)
      const collectionMint = generateSigner(umi)

      console.log('Generated UMI signers:')
      console.log('  Candy Machine:', candyMachine.publicKey.toString())
      console.log('  Collection Mint:', collectionMint.publicKey.toString())
      console.log('  Wallet (payer/authority):', umi.identity.publicKey.toString())

      setStep('Creating Collection NFT (waiting for finalized confirmation)...')

      // Step 1: Create the Collection NFT (REQUIRED for Candy Machine V3)
      // IMPORTANT: Must use 'finalized' commitment and verify exists before using in Candy Machine
      await createNft(umi, {
        mint: collectionMint,
        authority: umi.identity,
        name: name,
        uri: TEST_MANIFEST_URL,
        sellerFeeBasisPoints: percentAmount(parseFloat(royalties), 2),
        isCollection: true,
        collectionDetails: {
          __kind: 'V1',
          size: 0,
        },
      }).sendAndConfirm(umi, finalizedOptions)

      console.log('Collection NFT created and finalized:', collectionMint.publicKey.toString())

      // Step 1b: Verify the collection NFT exists before proceeding
      setStep('Verifying collection NFT exists on chain...')
      
      // Poll to ensure the NFT is fetchable (metadata account exists)
      let retries = 5
      let collectionVerified = false
      while (retries > 0 && !collectionVerified) {
        try {
          const asset = await fetchDigitalAsset(umi, collectionMint.publicKey)
          console.log('Collection NFT verified:', asset.metadata.name)
          collectionVerified = true
        } catch (err) {
          console.log(`Collection not yet fetchable, retrying... (${retries} left)`)
          retries--
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 2000)) // wait 2 seconds
          }
        }
      }
      
      if (!collectionVerified) {
        throw new Error('Failed to verify collection NFT exists after creation')
      }

      setStep('Creating Candy Machine V3 (waiting for confirmation)...')

      const itemsAvailable = Math.max(1, parseInt(supply || '1'))

      // Step 2: Create Candy Machine V3
      const createBuilder = await create(umi, {
        candyMachine,
        collectionMint: collectionMint.publicKey,
        collectionUpdateAuthority: umi.identity,
        tokenStandard: TokenStandard.NonFungible,
        sellerFeeBasisPoints: percentAmount(parseFloat(royalties), 2),
        itemsAvailable: itemsAvailable,
        symbol: symbol,
        maxEditionSupply: 0,
        isMutable: true,
        creators: [
          {
            address: umi.identity.publicKey,
            verified: true,
            percentageShare: 100,
          },
        ],
        configLineSettings: some({
          prefixName: '',
          nameLength: 32,
          prefixUri: '',
          uriLength: 200,
          isSequential: false,
        }),
        guards: {
          botTax: some({ lamports: sol(0.001), lastInstruction: true }),
          solPayment: some({
            lamports: sol(parseFloat(mintPrice)),
            destination: umi.identity.publicKey,
          }),
          startDate: some({ date: dateTime(new Date().toISOString()) }),
        },
      })

      await createBuilder.sendAndConfirm(umi, confirmOptions)

      console.log('Candy Machine created:', candyMachine.publicKey.toString())

      setStep('Saving to database...')

      // Save to DB
      await saveCandyMachine({
        id: candyMachineId,
        name,
        symbol,
        supply: itemsAvailable,
        mintPrice: parseFloat(mintPrice),
        manifestUrl: TEST_MANIFEST_URL,
        payerAddress: publicKey.toString(),
        candyMachineAddress: candyMachine.publicKey.toString(),
        collectionMintAddress: collectionMint.publicKey.toString(),
        deploymentStatus: 'deployed',
        deploymentTx: '',
        itemsInserted: false,
        totalItems: itemsAvailable,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })

      toast.success('Candy Machine V3 deployed!', {
        description: `Address: ${candyMachine.publicKey.toString().slice(0, 8)}...`,
      })

      onDeploySuccess(candyMachineId)
    } catch (error: any) {
      console.error('Deployment failed:', error)

      try {
        if (typeof error?.getLogs === 'function') {
          const logs = await error.getLogs()
          console.error('Full simulation logs:', logs)
        } else if (error?.logs) {
          console.error('Simulation logs:', error.logs)
        } else if (error?.message) {
          console.error('Error message:', error.message)
        }
      } catch (e) {
        console.error('Failed to get logs:', e)
      }

      toast.error('Deployment failed', {
        description: error?.message || 'Check console for details',
      })
    } finally {
      setDeploying(false)
      setStep('')
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Deploy Candy Machine V3</h2>
      <p className="text-gray-600 mb-6">
        Create a Token Metadata NFT collection using Candy Machine V3
      </p>

      <div className="mb-6">
        <WalletMultiButton />
      </div>

      {connected && (
        <>
          <div className="space-y-4 mb-6">
            <div>
              <Label>Collection Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={deploying}
              />
            </div>

            <div>
              <Label>Symbol (max 10 chars)</Label>
              <Input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                disabled={deploying}
                maxLength={10}
              />
            </div>

            <div>
              <Label>Supply (items available)</Label>
              <Input
                type="number"
                value={supply}
                onChange={(e) => setSupply(e.target.value)}
                disabled={deploying}
              />
            </div>

            <div>
              <Label>Mint Price (SOL)</Label>
              <Input
                type="number"
                step="0.01"
                value={mintPrice}
                onChange={(e) => setMintPrice(e.target.value)}
                disabled={deploying}
              />
            </div>

            <div>
              <Label>Creator Royalties (%)</Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={royalties}
                onChange={(e) => setRoyalties(e.target.value)}
                disabled={deploying}
              />
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              <strong>Collection URI:</strong>
              <p className="font-mono text-xs break-all mt-1">{TEST_MANIFEST_URL}</p>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded text-sm text-green-800">
              <strong>✓ Candy Machine V3</strong>
              <ul className="text-xs mt-1 list-disc list-inside space-y-1">
                <li>Package: @metaplex-foundation/mpl-candy-machine</li>
                <li>Standard: Token Metadata NFTs</li>
                <li>Guards: botTax, solPayment, startDate</li>
                <li>Full marketplace support</li>
              </ul>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded text-sm text-purple-800">
              <strong>Why Collection NFT?</strong>
              <p className="text-xs mt-1">
                Required by Candy Machine V3. It groups all minted NFTs together
                and enables on-chain verification. Marketplaces use this to display
                your collection.
              </p>
            </div>
          </div>

          {step && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-blue-800">{step}</span>
            </div>
          )}

          <Button
            onClick={handleDeploy}
            disabled={deploying}
            className="w-full"
            size="lg"
          >
            {deploying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deploying...
              </>
            ) : (
              'Deploy Candy Machine V3'
            )}
          </Button>
        </>
      )}
    </Card>
  )
}