import rootMeta from '../content/_meta.js'

// Search taxonomy derived from the canonical sidebar meta, so the section a
// result advertises never drifts from where the page actually lives in the nav.
// A separator entry opens a group; pages listed before the first separator
// belong to "Get started".
function buildSectionIndex() {
  const index = {}
  let group = 'Get started'
  for (const [key, value] of Object.entries(rootMeta)) {
    if (value && typeof value === 'object') {
      if (value.type === 'separator' && value.title) {
        group = value.title
        continue
      }
      // Object-form page entries (e.g. the hidden `resources` section) carry a
      // title but no string value. Index the ones that name a real route segment
      // (no `href` alias) so their nested pages resolve to the right section.
      if (value.title && !value.href) index[key] = { title: value.title, group }
      continue
    }
    if (typeof value === 'string') index[key] = { title: value, group }
  }
  return index
}

const SECTION_INDEX = buildSectionIndex()

function segmentsOf(path) {
  return path.replace(/^\/+/, '').split('/').filter(Boolean)
}

// The orienting label shown above a result: the folder/section title for nested
// pages, the sidebar group for top-level pages (whose own title is the result
// title already).
export function sectionForPath(path) {
  const segs = segmentsOf(path)
  if (!segs.length) return SECTION_INDEX.index?.group ?? 'Get started'
  const entry = SECTION_INDEX[segs[0]]
  if (!entry) return 'Get started'
  return segs.length > 1 ? entry.title : entry.group
}

// Coarse content type, used for a result's color-coded marker. Only 'app' and
// 'reference' carry a distinct dot color; everything else falls back to the
// default marker. Meaning is also carried by the section label, so the color is
// never the only signal.
export function kindForPath(path) {
  if (/^\/testnet(\/|$)/.test(path)) return 'app'
  if (/^\/developers(\/|$)/.test(path)) return 'reference'
  return 'concept'
}
