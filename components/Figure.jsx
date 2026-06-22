import { pathWithBase } from '../app/site-config.mjs'

// Base-path-aware diagram/screenshot embed with explicit dimensions so the
// browser reserves space (no layout shift). Mirrors SystemOverviewFigure:
// markdown ![]() can't carry width/height, and a raw <img src="/..."> would
// ship a root-scoped URL that 404s under the GitHub Pages base path.
export function Figure({ src, alt, width, height }) {
  return (
    <img
      src={pathWithBase(src)}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
    />
  )
}
