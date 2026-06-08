import { useMDXComponents as getThemeComponents } from 'nextra-theme-docs'
import { Image } from 'nextra/components'
import { BlogPostCard } from './components/BlogPostCard'
import { LaunchTimeline } from './components/LaunchTimeline'
import { ReadingTimeBadge } from './components/ReadingTimeBadge'
import { SystemOverviewFigure } from './components/SystemOverviewFigure'
import { TimedExplainers } from './components/TimedExplainers'

const themeComponents = getThemeComponents()

// Merge Polaris-specific MDX component overrides into the docs theme components.
export function useMDXComponents(components) {
  return {
    ...themeComponents,
    // Plain image instead of Nextra's zoomable default: react-medium-image-zoom
    // stamps an aria-owns pointing at a modal that only exists once zoomed, which
    // fails axe's aria-valid-attr-value. `Image` keeps Pagefind alt/title indexing.
    img: Image,
    BlogPostCard,
    LaunchTimeline,
    ReadingTimeBadge,
    SystemOverviewFigure,
    TimedExplainers,
    ...components
  }
}
