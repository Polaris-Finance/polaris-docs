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

// Static export to GitHub Pages. The default mode is the project site at
// tokenbrice.github.io/polaris-docs. Set BASE_PATH="" only when a validated root
// custom domain is ready.
export default withNextra({
  output: 'export',
  basePath: BASE_PATH,
  images: {
    unoptimized: true
  },
  reactStrictMode: true
})
