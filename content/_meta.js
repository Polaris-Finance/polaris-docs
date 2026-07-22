import { metaForDirectory } from '../components/navigation/NavLabel.js'

export default {
  // Site-wide page chrome: no visible breadcrumbs, no "On this page" panel
  // (owner decision, July 2026). JSON-LD breadcrumbs are unaffected.
  '*': {
    theme: {
      breadcrumb: false,
      toc: false
    }
  },
  ...metaForDirectory('/')
}
