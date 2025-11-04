import { StorageProvider, UploadResult } from "./types"
import { ArweaveUploader } from "./arweave"
import { NFTStorageUploader } from "./nft-storage"

export type { StorageProvider, UploadResult }

export async function uploadToStorage(
  provider: StorageProvider,
  collectionImage: File,
  nftAssets: FileList,
  collectionData: {
    name: string
    symbol: string
    description: string
    supply: number
  },
  wallet?: any,
  nftStorageApiKey?: string
): Promise<UploadResult> {
  if (provider === "arweave") {
    if (!wallet) {
      throw new Error("Wallet required for Arweave upload")
    }
    const uploader = new ArweaveUploader()
    await uploader.initialize(wallet)
    return uploader.uploadCollection(collectionImage, nftAssets, collectionData)
  } else {
    if (!nftStorageApiKey) {
      throw new Error("API key required for NFT.Storage")
    }
    const uploader = new NFTStorageUploader(nftStorageApiKey)
    return uploader.uploadCollection(collectionImage, nftAssets, collectionData)
  }
}
