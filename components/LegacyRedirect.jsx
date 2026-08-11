'use client'

import { useEffect } from 'react'
import { LEGACY_REDIRECTS } from '../app/legacy-redirects.mjs'
import { BASE_PATH, pathWithBase } from '../app/site-config.mjs'

export function LegacyRedirect() {
  useEffect(() => {
    let route = location.pathname
    if (BASE_PATH && route.startsWith(BASE_PATH)) route = route.slice(BASE_PATH.length)
    route = route.replace(/\/+$/, '') || '/'
    const target = LEGACY_REDIRECTS[route]
    if (target) location.replace(pathWithBase(target) + location.search + location.hash)
  }, [])

  return null
}
