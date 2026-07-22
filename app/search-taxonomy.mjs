import {
  navigationKindForRoute,
  navigationSectionForRoute,
  normalizeRoute
} from './navigation-config.mjs'

export function sectionForPath(path) {
  return navigationSectionForRoute(normalizeRoute(path))
}

export function kindForPath(path) {
  return navigationKindForRoute(normalizeRoute(path))
}
