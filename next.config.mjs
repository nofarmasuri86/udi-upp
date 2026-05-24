/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: {
    position: "bottom-right",
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
}

export default nextConfig
