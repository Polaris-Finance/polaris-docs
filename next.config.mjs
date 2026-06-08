import nextra from 'nextra'

const withNextra = nextra({
  // Nextra 4 reads MDX from the `content/` directory and builds the page map
  // automatically. Theme/search options can be added here later.
  defaultShowCopyCode: true,
  latex: true,
  search: {
    codeblocks: false
  }
})

// Static export to GitHub Pages. When deploying to a custom domain (docs.polarisfinance.io)
// BASE_PATH is unset and the site lives at the root. When deploying to a GitHub Pages
// subdirectory (e.g. tokenbrice.github.io/polaris-docs), set BASE_PATH=/polaris-docs in CI
// so Next.js prefixes all asset URLs correctly.
export default withNextra({
  output: 'export',
  basePath: process.env.BASE_PATH ?? '',
  images: {
    unoptimized: true
  },
  reactStrictMode: true
})
