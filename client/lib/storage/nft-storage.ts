import { Web3Storage, File as Web3File } from "web3.storage"
import { StorageUploader, UploadResult, NFTMetadata } from "./types"

export class NFTStorageUploader implements StorageUploader {
  private client: Web3Storage

  async initialize(apiKey: string) {
    this.client = new Web3Storage({ token: apiKey })
  }

  constructor(apiKey: string) {
    this.client = new Web3Storage({ token: apiKey })
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
    console.log("Uploading to web3.storage...")

    // Collect all files to upload in one batch
    const filesToUpload: Web3File[] = []

    // 1. Collection image
    console.log("Preparing collection image...")
    const collectionImageBuffer = await collectionImage.arrayBuffer()
    const collectionImageFile = new Web3File(
      [collectionImageBuffer],
      `collection/${collectionImage.name}`,
      { type: collectionImage.type }
    )
    filesToUpload.push(collectionImageFile)

    // 2. NFT images
    console.log("Preparing NFT images...")
    for (let i = 0; i < nftAssets.length; i++) {
      const file = nftAssets[i]
      const buffer = await file.arrayBuffer()
      const web3File = new Web3File([buffer], `images/${i}-${file.name}`, { type: file.type })
      filesToUpload.push(web3File)
    }

    // 3. Upload all files together
    console.log(`Uploading ${filesToUpload.length} files to web3.storage...`)
    const cid = await this.client.put(filesToUpload)
    console.log("Files uploaded! CID:", cid)

    // Construct URLs
    const collectionImageUrl = `https://${cid}.ipfs.w3s.link/collection/${collectionImage.name}`
    const nftImageUrls: string[] = []
    for (let i = 0; i < nftAssets.length; i++) {
      nftImageUrls.push(`https://${cid}.ipfs.w3s.link/images/${i}-${nftAssets[i].name}`)
    }

    // 4. Upload metadata files
    console.log("Uploading metadata...")
    const metadataFiles: Web3File[] = []
    for (let i = 0; i < nftImageUrls.length; i++) {
      const metadata: NFTMetadata = {
        name: `${collectionData.name} #${i + 1}`,
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
      const metadataFile = new Web3File([metadataJson], `metadata/${i}.json`, {
        type: "application/json",
      })
      metadataFiles.push(metadataFile)
    }

    const metadataCid = await this.client.put(metadataFiles)
    console.log("Metadata uploaded! CID:", metadataCid)

    const metadataUrls: string[] = []
    for (let i = 0; i < nftImageUrls.length; i++) {
      metadataUrls.push(`https://${metadataCid}.ipfs.w3s.link/metadata/${i}.json`)
    }

    // 5. Upload manifest
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
    const manifestFile = new Web3File([manifestJson], "manifest.json", {
      type: "application/json",
    })
    const manifestCid = await this.client.put([manifestFile])
    const manifestUrl = `https://${manifestCid}.ipfs.w3s.link/manifest.json`
    console.log("Manifest uploaded:", manifestUrl)

    return {
      collectionImageUrl,
      manifestUrl,
      nftMetadataUrls: metadataUrls,
    }
  }
}
