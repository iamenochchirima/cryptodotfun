import { NFTStorage, File as NFTFile } from "nft.storage"
import { StorageUploader, UploadResult, NFTMetadata } from "./types"

export class NFTStorageUploader implements StorageUploader {
  private client: NFTStorage

  constructor(apiKey: string) {
    this.client = new NFTStorage({ token: apiKey })
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
    console.log("Uploading collection image to NFT.Storage...")
    const collectionImageBuffer = await collectionImage.arrayBuffer()
    const collectionImageFile = new NFTFile(
      [collectionImageBuffer],
      collectionImage.name,
      { type: collectionImage.type }
    )
    const collectionImageCid = await this.client.storeBlob(collectionImageFile)
    const collectionImageUrl = `https://nftstorage.link/ipfs/${collectionImageCid}`
    console.log("Collection image:", collectionImageUrl)

    console.log("Uploading NFT images...")
    const nftImageUrls: string[] = []
    for (let i = 0; i < nftAssets.length; i++) {
      const file = nftAssets[i]
      const buffer = await file.arrayBuffer()
      const nftFile = new NFTFile([buffer], file.name, { type: file.type })
      const cid = await this.client.storeBlob(nftFile)
      const url = `https://nftstorage.link/ipfs/${cid}`
      nftImageUrls.push(url)
      console.log(`Image ${i}:`, url)
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
      const metadataFile = new NFTFile([metadataJson], `${i}.json`, {
        type: "application/json",
      })
      const cid = await this.client.storeBlob(metadataFile)
      const url = `https://nftstorage.link/ipfs/${cid}`
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
        files: metadataUrls.map((url, i) => ({
          uri: url,
          type: "application/json",
        })),
        category: "image",
      },
    }

    const manifestJson = JSON.stringify(manifest)
    const manifestFile = new NFTFile([manifestJson], "manifest.json", {
      type: "application/json",
    })
    const manifestCid = await this.client.storeBlob(manifestFile)
    const manifestUrl = `https://nftstorage.link/ipfs/${manifestCid}`
    console.log("Manifest:", manifestUrl)

    return {
      collectionImageUrl,
      manifestUrl,
      nftMetadataUrls: metadataUrls,
    }
  }
}
