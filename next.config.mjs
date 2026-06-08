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

// Static export to GitHub Pages — served at the root of the docs.polarisfinance.io
// subdomain, so no basePath is required. `images.unoptimized` is mandatory for
// `output: 'export'` or the build fails.
export default withNextra({
  output: 'export',
  images: {
    unoptimized: true
  },
  reactStrictMode: true
})
