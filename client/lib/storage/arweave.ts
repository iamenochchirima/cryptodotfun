import { WebIrys } from "@irys/sdk"
import { StorageUploader, UploadResult, NFTMetadata } from "./types"

export class ArweaveUploader implements StorageUploader {
  private irys: WebIrys | null = null

  async initialize(wallet: any) {
    if (!wallet) {
      throw new Error("Wallet is required for Arweave uploads")
    }

    console.log("Initializing Irys with Solana wallet...")
    console.log("Wallet adapter passed:", wallet)

    // For WebIrys with Solana, we need to check if we should use window.solana directly
    let provider;

    if (typeof window !== 'undefined') {
      // @ts-ignore
      provider = window.solana

      if (!provider) {
        throw new Error("No Solana wallet provider found. Please install Phantom or another Solana wallet.")
      }

      console.log("Using wallet provider:", provider)
      console.log("Provider publicKey:", provider.publicKey?.toString())
      console.log("Provider isPhantom:", provider.isPhantom)
      console.log("Provider methods:", Object.keys(provider).filter(k => typeof provider[k] === 'function'))

      if (!provider.publicKey) {
        throw new Error("Wallet not connected. Please connect your wallet first.")
      }

      // Check what transaction methods are available
      console.log("Has signTransaction:", typeof provider.signTransaction)
      console.log("Has signAndSendTransaction:", typeof provider.signAndSendTransaction)
      console.log("Has sendTransaction:", typeof provider.sendTransaction)

      // Ensure the provider has the necessary methods
      if (!provider.signTransaction && !provider.signAndSendTransaction) {
        throw new Error("Wallet provider doesn't support transaction signing")
      }

      // Irys expects sendTransaction, but Phantom uses signAndSendTransaction
      // Create a wrapper if needed
      if (!provider.sendTransaction && provider.signAndSendTransaction) {
        console.log("Wrapping signAndSendTransaction as sendTransaction")
        provider.sendTransaction = provider.signAndSendTransaction.bind(provider)
      }
    } else {
      throw new Error("Window object not available")
    }

    console.log("Creating WebIrys instance...")
    this.irys = new WebIrys({
      network: "devnet",
      token: "solana",
      wallet: { name: "solana", provider },
      config: { providerUrl: "https://api.devnet.solana.com" },
    })

    console.log("Calling irys.ready()...")
    try {
      await this.irys.ready()
      console.log("Irys initialized successfully")

      // Check balance but don't auto-fund for now due to RPC issues
      try {
        const balance = await this.irys.getLoadedBalance()
        console.log("Irys balance:", balance.toString())

        if (balance.toNumber() === 0) {
          console.warn("⚠️ Irys account has zero balance.")
          console.log("Note: Uploads under 100 KiB are free on Irys devnet")
          console.log("For larger uploads, fund manually: const fundTx = await irys.fund(irys.utils.toAtomic(0.1))")
        }
      } catch (balanceError) {
        console.warn("Could not check Irys balance:", balanceError)
        console.log("Continuing anyway - uploads under 100 KiB are free")
      }
    } catch (error: any) {
      console.error("Error during Irys initialization:", error)
      throw new Error(`Failed to initialize Irys: ${error.message}`)
    }
  }

  async uploadCollection(
    collectionImage: File,
    nftAssets: FileList,
    collectionData: {
      name: string
      symbol: string
      description: string
      supply: number
    }
  ): Promise<UploadResult> {
    if (!this.irys) {
      throw new Error("Arweave uploader not initialized")
    }

    console.log("Uploading collection image to Arweave...")
    console.log("Collection image file:", collectionImage)
    console.log("File type:", collectionImage.type)
    console.log("File size:", collectionImage.size)

    // Convert File to Buffer for WebIrys
    // WebIrys has issues with File objects directly, need to convert to Buffer
    const arrayBuffer = await collectionImage.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log("Converted to Buffer, length:", buffer.length)

    const collectionImageTx = await this.irys.upload(buffer, {
      tags: [
        { name: "Content-Type", value: collectionImage.type },
        { name: "App-Name", value: "CryptoDotFun" },
        { name: "Type", value: "collection-image" },
      ],
    })
    const collectionImageUrl = `https://arweave.net/${collectionImageTx.id}`
    console.log("Collection image:", collectionImageUrl)

    console.log("Uploading NFT images...")
    const nftImageUrls: string[] = []
    for (let i = 0; i < nftAssets.length; i++) {
      const file = nftAssets[i]
      console.log(`Uploading NFT image ${i}:`, file.name, file.size)

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const tx = await this.irys.upload(buffer, {
        tags: [
          { name: "Content-Type", value: file.type },
          { name: "App-Name", value: "CryptoDotFun" },
          { name: "Type", value: "nft-image" },
          { name: "Index", value: i.toString() },
        ],
      })
      const url = `https://arweave.net/${tx.id}`
      nftImageUrls.push(url)
      console.log(`Image ${i} uploaded:`, url)
    }

    console.log("Uploading metadata...")
    const metadataUrls: string[] = []
    for (let i = 0; i < nftImageUrls.length; i++) {
      const metadata: NFTMetadata = {
        name: `${collectionData.name} #${i}`,
        symbol: collectionData.symbol,
        description: collectionData.description,
        image: nftImageUrls[i],
        attributes: [],
        properties: {
          files: [{ uri: nftImageUrls[i], type: nftAssets[i].type }],
          category: "image",
        },
      }

      const metadataJson = JSON.stringify(metadata)
      const metadataTx = await this.irys.upload(metadataJson, {
        tags: [
          { name: "Content-Type", value: "application/json" },
          { name: "App-Name", value: "CryptoDotFun" },
          { name: "Type", value: "nft-metadata" },
          { name: "Index", value: i.toString() },
        ],
      })
      const url = `https://arweave.net/${metadataTx.id}`
      metadataUrls.push(url)
      console.log(`Metadata ${i}:`, url)
    }

    console.log("Uploading manifest...")
    const manifest = {
      name: collectionData.name,
      symbol: collectionData.symbol,
      description: collectionData.description,
      image: collectionImageUrl,
      seller_fee_basis_points: 500,
      properties: {
        files: metadataUrls.map((url) => ({
          uri: url,
          type: "application/json",
        })),
        category: "image",
      },
    }

    const manifestJson = JSON.stringify(manifest)
    const manifestTx = await this.irys.upload(manifestJson, {
      tags: [
        { name: "Content-Type", value: "application/json" },
        { name: "App-Name", value: "CryptoDotFun" },
        { name: "Type", value: "manifest" },
      ],
    })
    const manifestUrl = `https://arweave.net/${manifestTx.id}`
    console.log("Manifest:", manifestUrl)

    return {
      collectionImageUrl,
      manifestUrl,
      nftMetadataUrls: metadataUrls,
    }
  }
}
