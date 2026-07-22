import nextra from 'nextra'
import { BASE_PATH } from './app/site-config.mjs'

const withNextra = nextra({
  // Nextra 4 reads MDX from the `content/` directory and builds the page map
  // automatically. Theme/search options can be added here later.
  defaultShowCopyCode: true,
  search: {
    codeblocks: false
  }
})

// Static export to the root of the docs.polaris.finance custom domain.
export default withNextra({
  output: 'export',
  basePath: BASE_PATH,
  // The dev server runs in its own dist dir (set in scripts/dev.mjs) so
  // `next build` never clobbers a running dev server's state — interleaving
  // the two in one .next corrupts the dev webpack cache ("X is not exported
  // from react"). Builds keep the default .next → out/ export flow.
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  images: {
    unoptimized: true
  },
  reactStrictMode: true
})
