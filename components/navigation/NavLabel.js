import { createElement } from 'react'
import { metaEntriesForDirectory } from '../../app/navigation-config.mjs'
import { NavIcon } from './NavIcon.js'

export function NavLabel({ children, icon }) {
  return createElement(
    'span',
    { className: 'pl-nav-label' },
    createElement(NavIcon, { icon }),
    createElement('span', { className: 'pl-nav-text' }, children)
  )
}

export function NavGroupLabel({ children }) {
  return createElement('span', { className: 'pl-nav-group-label' }, children)
}

export function metaForDirectory(directory) {
  return Object.fromEntries(
    metaEntriesForDirectory(directory).map((entry) => {
      if (entry.type === 'separator') {
        return [
          entry.metaKey,
          {
            type: 'separator',
            title: createElement(NavGroupLabel, { key: entry.metaKey }, entry.label)
          }
        ]
      }

      const title = createElement(NavLabel, { icon: entry.icon, key: entry.id }, entry.label)
      if (entry.display) {
        return [entry.metaKey, { title, display: entry.display, theme: entry.theme }]
      }

      return [entry.metaKey, title]
    })
  )
}
