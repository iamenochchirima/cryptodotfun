/** @type {import('next').NextConfig} */
const nextConfig = {
   publicRuntimeConfig: {
    iiCanId: process.env.CANISTER_ID_INTERNET_IDENTITY || "rwlgt-iiaaa-aaaaa-aaaba-cai",
    network: process.env.DFX_NETWORK || "local",
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
