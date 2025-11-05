import { PinataSDK } from "pinata"
import { StorageUploader, UploadResult, NFTMetadata } from "./types"

export class PinataUploader implements StorageUploader {
  private client: PinataSDK

  constructor(jwt: string) {
    this.client = new PinataSDK({ pinataJwt: jwt })
  }

  async initialize() {
    console.log("Pinata client initialized")
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
    console.log("Uploading to Pinata/IPFS...")

    // 1. Upload collection image
    console.log("Uploading collection image...")
    const collImageUpload = await this.client.upload.public.file(collectionImage)
    const collectionImageUrl = `https://gateway.pinata.cloud/ipfs/${collImageUpload.cid}`
    console.log("Collection image uploaded:", collectionImageUrl)

    // 2. Upload NFT images
    console.log(`Uploading ${nftAssets.length} NFT images...`)
    const nftImageUrls: string[] = []
    for (let i = 0; i < nftAssets.length; i++) {
      const file = nftAssets[i]
      const upload = await this.client.upload.public.file(file)
      const url = `https://gateway.pinata.cloud/ipfs/${upload.cid}`
      nftImageUrls.push(url)
      console.log(`Image ${i + 1}/${nftAssets.length} uploaded`)
    }

    // 3. Upload metadata files
    console.log("Uploading metadata files...")
    const metadataUrls: string[] = []
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

      const metadataFile = new File(
        [JSON.stringify(metadata)],
        `${i}.json`,
        { type: "application/json" }
      )
      const upload = await this.client.upload.public.file(metadataFile)
      const url = `https://gateway.pinata.cloud/ipfs/${upload.cid}`
      metadataUrls.push(url)
    }
    console.log("Metadata files uploaded")

    // 4. Upload manifest
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

    const manifestFile = new File(
      [JSON.stringify(manifest)],
      "manifest.json",
      { type: "application/json" }
    )
    const manifestUpload = await this.client.upload.public.file(manifestFile)
    const manifestUrl = `https://gateway.pinata.cloud/ipfs/${manifestUpload.cid}`
    console.log("Manifest uploaded:", manifestUrl)

    return {
      collectionImageUrl,
      manifestUrl,
      nftMetadataUrls: metadataUrls,
    }
  }
}
