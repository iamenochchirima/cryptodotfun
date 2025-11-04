export type StorageProvider = "arweave" | "nft-storage"

export interface UploadResult {
  collectionImageUrl: string
  manifestUrl: string
  nftMetadataUrls: string[]
}

export interface NFTMetadata {
  name: string
  symbol: string
  description: string
  image: string
  attributes?: Array<{ trait_type: string; value: string | number }>
  properties?: {
    files: Array<{ uri: string; type: string }>
    category: string
  }
}

export interface StorageUploader {
  uploadCollection(
    collectionImage: File,
    nftAssets: FileList,
    collectionData: {
      name: string
      symbol: string
      description: string
      supply: number
    }
  ): Promise<UploadResult>
}
