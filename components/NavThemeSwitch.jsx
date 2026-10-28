'use client'

// One-click light/dark toggle for the navbar. Replaces Nextra's ThemeSwitch,
// which opens a Light / Dark / System listbox. Light stays the default theme
// (nextThemes.defaultTheme in app/layout.jsx); a click flips to the other
// mode and next-themes persists the choice.
//
// Kept as its own client module: importing theme hooks straight into the
// server layout lets webpack dev compile them in the react-server layer
// ("'useLayoutEffect' is not exported from 'react'").
import { useTheme } from 'next-themes'
import { useMounted } from 'nextra/hooks'
import { MoonIcon, SunIcon } from 'nextra/icons'

export function NavThemeSwitch() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useMounted()
  const isDark = mounted && resolvedTheme === 'dark'
  const Icon = isDark ? MoonIcon : SunIcon
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <button
      type="button"
      className="pl-nav-theme-toggle"
      title={label}
      aria-label={label}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      <Icon height="12" aria-hidden="true" />
    </button>
  )
}
