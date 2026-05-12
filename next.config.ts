import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'uploadthing.com' },
      { protocol: 'https', hostname: 'utfs.io' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  transpilePackages: [
    'lexical',
    '@lexical/react',
    '@lexical/rich-text',
    '@lexical/list',
    '@lexical/link',
    '@lexical/utils',
    '@lexical/selection',
    '@lexical/headless',
    '@lexical/markdown',
    '@lexical/clipboard',
    '@lexical/code',
    '@lexical/history',
    '@lexical/overflow',
    '@lexical/table',
    '@lexical/text',
    '@lexical/yjs',
    'mathlive',
    '@cortex-js/compute-engine',
    '@excalidraw/excalidraw',
  ],
}

export default nextConfig
