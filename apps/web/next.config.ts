import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@clearhead/shared", "@clearhead/entitlements", "@clearhead/database"],
  experimental: { optimizePackageImports: ["lucide-react"] }
}

export default nextConfig
