// MintStage.tsx - Candy Machine V3 Minting
// Based on: https://developers.metaplex.com/candy-machine/mint

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, CheckCircle, ExternalLink, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { mintV2, mplCandyMachine, fetchCandyMachine } from '@metaplex-foundation/mpl-candy-machine'
import { mplTokenMetadata, fetchDigitalAsset } from '@metaplex-foundation/mpl-token-metadata'
import { publicKey as umiPublicKey, generateSigner } from '@metaplex-foundation/umi'
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters'
import { getCandyMachine } from '@/lib/candy-machine-db'

interface MintStageProps {
  candyMachineId: string
}

interface MintedNFT {
  mint: string
  signature: string
  name?: string
  uri?: string
  image?: string
  loading?: boolean
}

export function MintStage({ candyMachineId }: MintStageProps) {
  const { publicKey, connected, signTransaction, signAllTransactions } = useWallet()
  const [minting, setMinting] = useState(false)
  const [step, setStep] = useState('')
  const [candyMachine, setCandyMachine] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mintedNFTs, setMintedNFTs] = useState<MintedNFT[]>([])

  useEffect(() => {
    loadCandyMachine()
  }, [candyMachineId])

  const loadCandyMachine = async () => {
    const cm = await getCandyMachine(candyMachineId)
    setCandyMachine(cm)
    setLoading(false)
  }

  const fetchNFTMetadata = async (umi: any, mintAddress: any, index: number) => {
    try {
      console.log('Fetching NFT metadata for:', mintAddress)

      // Wait a bit for the NFT to be indexed
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Fetch the digital asset (NFT metadata account)
      const asset = await fetchDigitalAsset(umi, mintAddress)

      console.log('NFT metadata account:', asset.metadata)
      console.log('  Name:', asset.metadata.name)
      console.log('  URI:', asset.metadata.uri)

      // Fetch the JSON metadata from the URI
      const metadataResponse = await fetch(asset.metadata.uri)
      const metadata = await metadataResponse.json()

      console.log('NFT JSON metadata:', metadata)
      console.log('  Image:', metadata.image)

      // Update the minted NFT with metadata
      setMintedNFTs(prev => {
        const updated = [...prev]
        if (updated[index]) {
          updated[index] = {
            ...updated[index],
            name: asset.metadata.name,
            uri: asset.metadata.uri,
            image: metadata.image,
            loading: false,
          }
        }
        return updated
      })

    } catch (error) {
      console.error('Failed to fetch NFT metadata:', error)
      // Mark as loaded even if failed
      setMintedNFTs(prev => {
        const updated = [...prev]
        if (updated[index]) {
          updated[index] = {
            ...updated[index],
            loading: false,
          }
        }
        return updated
      })
    }
  }

  const handleMint = async () => {
    if (!connected || !publicKey || !signTransaction || !signAllTransactions) {
      toast.error('Please connect your wallet')
      return
    }

    if (!candyMachine?.itemsInserted) {
      toast.error('Items must be inserted first')
      return
    }

    try {
      setMinting(true)
      setStep('Initializing UMI...')

      // Create UMI instance with wallet adapter identity
      const umi = createUmi('https://api.devnet.solana.com')
        .use(walletAdapterIdentity({ publicKey, signTransaction, signAllTransactions }))
        .use(mplTokenMetadata())
        .use(mplCandyMachine())

      // Confirmation options
      const confirmOptions = {
        send: { commitment: 'confirmed' as const },
        confirm: { commitment: 'confirmed' as const },
      }

      setStep('Fetching candy machine data...')

      const candyMachinePublicKey = umiPublicKey(candyMachine.candyMachineAddress)
      const candyMachineAccount = await fetchCandyMachine(umi, candyMachinePublicKey)

      console.log('Candy Machine data:')
      console.log('  Address:', candyMachinePublicKey)
      console.log('  Candy Machine Account:', candyMachineAccount)

      setStep('Generating NFT mint keypair...')

      // Generate a new keypair for the NFT mint
      const nftMint = generateSigner(umi)

      console.log('Minting NFT:')
      console.log('  NFT Mint:', nftMint.publicKey)
      console.log('  Minter:', umi.identity.publicKey.toString())
      console.log('  Collection:', candyMachineAccount.collectionMint)

      setStep('Building mint transaction...')

      // Build the mint transaction
      const mintBuilder = mintV2(umi, {
        candyMachine: candyMachinePublicKey,
        nftMint,
        collectionMint: candyMachineAccount.collectionMint,
        collectionUpdateAuthority: candyMachineAccount.authority,
      })

      setStep('Sending mint transaction...')

      // Send and confirm the transaction
      await mintBuilder.sendAndConfirm(umi, confirmOptions)

      console.log('NFT minted successfully!')
      console.log('  Mint address:', nftMint.publicKey)

      // Add to minted NFTs list with loading state
      const mintedNFT: MintedNFT = {
        mint: nftMint.publicKey.toString(),
        signature: 'confirmed',
        loading: true,
      }
      setMintedNFTs(prev => [...prev, mintedNFT])

      toast.success('NFT Minted Successfully!', {
        description: `Mint: ${nftMint.publicKey.toString().slice(0, 8)}...`,
      })

      // Fetch NFT metadata and image in the background
      fetchNFTMetadata(umi, nftMint.publicKey, mintedNFTs.length)

    } catch (error: any) {
      console.error('Mint failed:', error)

      // Log detailed error information
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

      toast.error('Mint failed', {
        description: error?.message || 'Check console for details',
      })
    } finally {
      setMinting(false)
      setStep('')
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Card>
    )
  }

  if (!candyMachine) {
    return (
      <Card className="p-6">
        <p className="text-red-600">Candy machine not found</p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Step 3: Mint NFTs</h2>
      <p className="text-gray-600 mb-6">
        Mint Token Metadata NFTs from your Candy Machine V3
      </p>

      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Collection:</strong> {candyMachine.name}
          </div>
          <div>
            <strong>Mint Price:</strong> {candyMachine.mintPrice} SOL
          </div>
          <div>
            <strong>Supply:</strong> {candyMachine.supply}
          </div>
          <div>
            <strong>You Minted:</strong> {mintedNFTs.length}
          </div>
        </div>

        {candyMachine.deploymentTx && (
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <div className="flex items-center gap-2 text-green-800 text-sm mb-2">
              <CheckCircle className="h-4 w-4" />
              <span>Candy Machine Ready</span>
            </div>
            <div className="space-y-1 text-xs">
              <a
                href={`https://explorer.solana.com/tx/${candyMachine.deploymentTx}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                Deployment TX <ExternalLink className="h-3 w-3" />
              </a>
              {candyMachine.itemsInsertTx && (
                <a
                  href={`https://explorer.solana.com/tx/${candyMachine.itemsInsertTx}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  Insert Items TX <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {!candyMachine.itemsInserted && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            ⚠️ Items have not been inserted yet. Complete Step 2 first.
          </div>
        )}

        <div className="p-4 bg-blue-50 border border-blue-200 rounded text-sm">
          <strong>Candy Machine Address:</strong>
          <p className="font-mono text-xs break-all mt-1">
            {candyMachine.candyMachineAddress}
          </p>
        </div>

        <div className="mb-4">
          <WalletMultiButton />
        </div>
      </div>

      {step && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-blue-800">{step}</span>
        </div>
      )}

      <Button
        onClick={handleMint}
        disabled={minting || !connected || !candyMachine.itemsInserted}
        className="w-full"
        size="lg"
      >
        {minting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Minting...
          </>
        ) : (
          <>
            <ImageIcon className="mr-2 h-4 w-4" />
            Mint NFT for {candyMachine.mintPrice} SOL
          </>
        )}
      </Button>

      {mintedNFTs.length > 0 && (
        <Card className="mt-6 p-4 bg-green-50">
          <h3 className="font-bold text-green-800 mb-3">Your Minted NFTs ({mintedNFTs.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mintedNFTs.map((nft, idx) => (
              <div key={idx} className="p-3 bg-white rounded border border-green-200">
                {/* NFT Image */}
                <div className="aspect-square bg-gray-100 rounded mb-3 flex items-center justify-center overflow-hidden">
                  {nft.loading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      <span className="text-xs text-gray-500">Loading metadata...</span>
                    </div>
                  ) : nft.image ? (
                    <img
                      src={nft.image}
                      alt={nft.name || `NFT #${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-gray-300" />
                  )}
                </div>

                {/* NFT Details */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold">
                    {nft.name || `NFT #${idx + 1}`}
                  </div>
                  <div className="font-mono text-xs text-gray-600 break-all">
                    {nft.mint.slice(0, 8)}...{nft.mint.slice(-8)}
                  </div>
                  <a
                    href={`https://explorer.solana.com/address/${nft.mint}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    View on Explorer <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded text-sm text-green-800">
        <strong>✓ Candy Machine V3 Minting</strong>
        <ul className="text-xs mt-1 list-disc list-inside space-y-1">
          <li>Guards enforce mint price and restrictions</li>
          <li>NFTs are automatically added to the collection</li>
          <li>Token Metadata standard for full marketplace support</li>
        </ul>
      </div>
    </Card>
  )
}
