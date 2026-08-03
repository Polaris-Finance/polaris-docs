import {
  navigationKindForRoute,
  navigationSectionForRoute,
  normalizeRoute,
  toneForRoute
} from './navigation-config.mjs'

export function sectionForPath(path) {
  return navigationSectionForRoute(normalizeRoute(path))
}

export function kindForPath(path) {
  return navigationKindForRoute(normalizeRoute(path))
}

export function toneForPath(path) {
  return toneForRoute(normalizeRoute(path))
}
