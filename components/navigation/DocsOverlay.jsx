'use client'

import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { useEffect } from 'react'

export function DocsOverlay({ children, initialFocus, kind, open, onClose }) {
  useEffect(() => {
    if (!open) return

    const background = [...document.body.children].filter(
      (element) =>
        element.id !== 'headlessui-portal-root' &&
        element.tagName !== 'SCRIPT' &&
        element.tagName !== 'NEXT-ROUTE-ANNOUNCER'
    )
    const previous = background.map((element) => ({
      element,
      ariaHidden: element.getAttribute('aria-hidden'),
      inert: element.hasAttribute('inert')
    }))

    for (const { element } of previous) {
      element.setAttribute('inert', '')
      element.setAttribute('aria-hidden', 'true')
    }

    return () => {
      for (const state of previous) {
        if (!state.inert) state.element.removeAttribute('inert')
        if (state.ariaHidden === null) state.element.removeAttribute('aria-hidden')
        else state.element.setAttribute('aria-hidden', state.ariaHidden)
      }
    }
  }, [open])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      initialFocus={initialFocus}
      className={`pl-docs-overlay pl-docs-overlay--${kind}`}
    >
      <DialogBackdrop transition className="pl-docs-overlay-backdrop" />
      <div className="pl-docs-overlay-frame">
        <DialogPanel transition className="pl-docs-overlay-panel">
          {children}
        </DialogPanel>
      </div>
    </Dialog>
  )
}
