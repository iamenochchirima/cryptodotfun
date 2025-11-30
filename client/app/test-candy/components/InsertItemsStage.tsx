// InsertItemsStage.tsx - Candy Machine V3 Config Lines
// Based on: https://developers.metaplex.com/candy-machine/manage

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, CheckCircle, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { addConfigLines, mplCandyMachine } from '@metaplex-foundation/mpl-candy-machine'
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import { publicKey as umiPublicKey } from '@metaplex-foundation/umi'
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters'
import { getCandyMachine, updateCandyMachine } from '@/lib/candy-machine-db'

const TEST_MANIFEST_URL = 'https://teal-random-dingo-514.mypinata.cloud/ipfs/bafkreibiklbh7i7kmjwqgr3w2hqgakscgkm2nyb2cgnatuj47xvcqxtzxq'

interface InsertItemsStageProps {
  candyMachineId: string
  onInsertSuccess: () => void
}

interface NFTMetadata {
  name: string
  uri: string
}

export function InsertItemsStage({ candyMachineId, onInsertSuccess }: InsertItemsStageProps) {
  const { publicKey, connected, signTransaction, signAllTransactions } = useWallet()
  const [inserting, setInserting] = useState(false)
  const [step, setStep] = useState('')
  const [candyMachine, setCandyMachine] = useState<any>(null)
  const [items, setItems] = useState<NFTMetadata[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCandyMachine()
    fetchItems()
  }, [candyMachineId])

  const loadCandyMachine = async () => {
    const cm = await getCandyMachine(candyMachineId)
    setCandyMachine(cm)
    setLoading(false)
  }

  const fetchItems = async () => {
    try {
      setStep('Fetching manifest...')

      const response = await fetch(TEST_MANIFEST_URL)
      const data = await response.json()

      const files = data.properties?.files || []
      const nftItems: NFTMetadata[] = files.map((file: any, index: number) => ({
        name: `${index}`,
        uri: file.uri,
      }))

      console.log('Loaded items from manifest:', nftItems.length)
      setItems(nftItems)
      setStep('')
    } catch (error) {
      console.error('Failed to fetch manifest:', error)
      toast.error('Failed to fetch manifest')
    }
  }

  const handleInsertItems = async () => {
    if (!connected || !publicKey || !signTransaction || !signAllTransactions || !candyMachine) {
      toast.error('Please connect your wallet')
      return
    }

    if (items.length === 0) {
      toast.error('No items to insert')
      return
    }

    try {
      setInserting(true)

      setStep('Initializing UMI...')

      // Create UMI instance with wallet adapter identity (same as DeployStage)
      const umi = createUmi('https://api.devnet.solana.com')
        .use(walletAdapterIdentity({ publicKey, signTransaction, signAllTransactions }))
        .use(mplTokenMetadata())
        .use(mplCandyMachine())

      // Confirmation options
      const confirmOptions = {
        send: { commitment: 'confirmed' as const },
        confirm: { commitment: 'confirmed' as const },
      }

      console.log('Inserting items into candy machine:')
      console.log('  Candy Machine:', candyMachine.candyMachineAddress)
      console.log('  Total Items:', items.length)
      console.log('  Authority:', umi.identity.publicKey.toString())

      // Split items into batches to avoid transaction size limits
      // With long IPFS URIs (~80+ chars), we need smaller batches
      // Solana tx limit is 1232 bytes, so 5 items is safe for most URI lengths
      const BATCH_SIZE = 5
      const batches = []
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        batches.push(items.slice(i, i + BATCH_SIZE))
      }

      console.log(`  Batches: ${batches.length} (${BATCH_SIZE} items per batch)`)

      // Process each batch
      let currentIndex = 0
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i]
        setStep(`Adding config lines batch ${i + 1}/${batches.length} (${batch.length} items)...`)

        console.log(`Processing batch ${i + 1}/${batches.length}:`)
        console.log(`  Index: ${currentIndex}`)
        console.log(`  Items: ${batch.length}`)

        const builder = addConfigLines(umi, {
          candyMachine: umiPublicKey(candyMachine.candyMachineAddress),
          index: currentIndex,
          configLines: batch.map(item => ({
            name: item.name,
            uri: item.uri,
          })),
        })

        await builder.sendAndConfirm(umi, confirmOptions)

        console.log(`  ✓ Batch ${i + 1} confirmed`)
        currentIndex += batch.length
      }

      console.log('All items inserted successfully!')

      await updateCandyMachine(candyMachineId, {
        itemsInserted: true,
        itemsInsertTx: 'confirmed',
      })

      toast.success('Items inserted successfully!', {
        description: `${items.length} config lines added in ${batches.length} batches`,
      })

      onInsertSuccess()

    } catch (error: any) {
      console.error('Insert items failed:', error)

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

      toast.error('Failed to insert items', {
        description: error?.message || 'Check console for details',
      })

      await updateCandyMachine(candyMachineId, {
        itemsInsertError: error.message,
      })
    } finally {
      setInserting(false)
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
      <h2 className="text-2xl font-bold mb-4">Step 2: Insert Config Lines</h2>
      <p className="text-gray-600 mb-6">
        Add NFT metadata config lines to your Candy Machine V3
      </p>

      <div className="mb-6">
        <WalletMultiButton />
      </div>

      {connected && (
        <>
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Collection:</strong> {candyMachine.name}
              </div>
              <div>
                <strong>Supply:</strong> {candyMachine.supply}
              </div>
              <div>
                <strong>Mint Price:</strong> {candyMachine.mintPrice} SOL
              </div>
              <div>
                <strong>Items Loaded:</strong> {items.length}
              </div>
            </div>

            {candyMachine.deploymentTx && (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center gap-2 text-green-800 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span>Candy Machine Deployed</span>
                </div>
                <a
                  href={`https://explorer.solana.com/tx/${candyMachine.deploymentTx}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                >
                  View transaction <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            <div className="p-4 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              <strong>Candy Machine Address:</strong>
              <p className="font-mono text-xs break-all mt-1 text-blue-900">
                {candyMachine.candyMachineAddress}
              </p>
            </div>

            {items.length > 0 && (
              <details className="p-4 bg-gray-50 border rounded">
                <summary className="cursor-pointer font-semibold text-sm">
                  View {items.length} items to insert
                </summary>
                <div className="mt-3 space-y-2 max-h-60 overflow-auto">
                  {items.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="text-xs border-l-2 border-gray-300 pl-2">
                      <div><strong>#{idx}:</strong> {item.name}</div>
                      <div className="text-gray-600 font-mono break-all">{item.uri}</div>
                    </div>
                  ))}
                  {items.length > 5 && (
                    <div className="text-xs text-gray-500">
                      ... and {items.length - 5} more items
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="p-4 bg-green-50 border border-green-200 rounded text-sm text-green-800">
              <strong>✓ Candy Machine V3</strong>
              <p className="text-xs mt-1">Config lines define metadata for each NFT in the collection</p>
            </div>
          </div>

          {step && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-blue-800">{step}</span>
            </div>
          )}

          <Button
            onClick={handleInsertItems}
            disabled={inserting || items.length === 0 || candyMachine.itemsInserted}
            className="w-full"
            size="lg"
          >
            {inserting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Inserting...
              </>
            ) : candyMachine.itemsInserted ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Items Already Inserted
              </>
            ) : (
              `Insert ${items.length} Config Lines`
            )}
          </Button>

          {candyMachine.itemsInsertTx && (
            <a
              href={`https://explorer.solana.com/tx/${candyMachine.itemsInsertTx}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-3 text-center text-sm text-blue-600 hover:underline"
            >
              View insert transaction →
            </a>
          )}
        </>
      )}
    </Card>
  )
}