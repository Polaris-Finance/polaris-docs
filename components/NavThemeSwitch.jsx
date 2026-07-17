'use client'

// Explicit client boundary for the navbar theme switch. Importing ThemeSwitch
// straight into the server layout leaves the RSC layer assignment to the
// bundler, and webpack dev's incremental rebuilds sometimes compile the navbar
// menu chunk in the react-server layer — where `react` has no hook exports
// ("'useLayoutEffect' is not exported from 'react'"). The wrapper pins it to
// the client layer.
export { ThemeSwitch as NavThemeSwitch } from 'nextra-theme-docs'
