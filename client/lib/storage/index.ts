import { StorageProvider, UploadResult } from "./types"
import { ArweaveUploader } from "./arweave"
import { PinataUploader } from "./pinata"

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
  pinataApiKey?: string
): Promise<UploadResult> {
  if (provider === "arweave") {
    if (!wallet) {
      throw new Error("Wallet required for Arweave upload")
    }
    const uploader = new ArweaveUploader()
    await uploader.initialize(wallet)
    return uploader.uploadCollection(collectionImage, nftAssets, collectionData)
  } else {
    if (!pinataApiKey) {
      throw new Error("API key required for Pinata")
    }
    const uploader = new PinataUploader(pinataApiKey)
    await uploader.initialize()
    return uploader.uploadCollection(collectionImage, nftAssets, collectionData)
  }
}
