'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

function createZoomTarget(image, open) {
  const originalTabIndex = image.getAttribute('tabindex')
  const originalRole = image.getAttribute('role')
  const originalLabel = image.getAttribute('aria-label')
  const label = `Enlarge image${image.alt ? `: ${image.alt}` : ''}`

  image.classList.add('pl-image-zoom-target')
  image.setAttribute('tabindex', '0')
  image.setAttribute('role', 'button')
  image.setAttribute('aria-label', label)

  const activate = (event) => {
    event.preventDefault()
    event.stopPropagation()
    open(image, image)
  }
  const onKeyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    activate(event)
  }

  image.addEventListener('click', activate)
  image.addEventListener('keydown', onKeyDown)

  return () => {
    image.removeEventListener('click', activate)
    image.removeEventListener('keydown', onKeyDown)
    image.classList.remove('pl-image-zoom-target')

    if (originalTabIndex === null) image.removeAttribute('tabindex')
    else image.setAttribute('tabindex', originalTabIndex)
    if (originalRole === null) image.removeAttribute('role')
    else image.setAttribute('role', originalRole)
    if (originalLabel === null) image.removeAttribute('aria-label')
    else image.setAttribute('aria-label', originalLabel)
  }
}

export function ImageZoomEnhancements() {
  const pathname = usePathname()
  const [active, setActive] = useState(null)
  const closeButtonRef = useRef(null)

  useEffect(() => {
    const cleanups = []
    const images = document.querySelectorAll('article main img')

    for (const image of images) {
      if (image.closest('.pl-docs-home')) continue

      let wrapper = image.closest('.pl-content-image')
      let legacyWrapper = false

      if (!wrapper) {
        wrapper = document.createElement('div')
        // Keep literal and future non-MDX images on the same canonical media
        // contract as images emitted by mdx-components.js.
        wrapper.className = 'pl-content-image pl-content-image--legacy'
        image.before(wrapper)
        wrapper.append(image)
        legacyWrapper = true
      }

      if (image.classList.contains('pl-image-zoom-target')) continue

      const cleanupTarget = createZoomTarget(image, (target, trigger) => {
        setActive({
          alt: target.alt || '',
          src: target.currentSrc || target.src,
          trigger
        })
      })
      cleanups.push(() => {
        cleanupTarget()
        if (legacyWrapper && wrapper.isConnected) wrapper.replaceWith(image)
      })
    }

    return () => cleanups.forEach((cleanup) => cleanup())
  }, [pathname])

  useEffect(() => {
    if (!active) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus({ preventScroll: true })

    const close = () => {
      const trigger = active.trigger
      setActive(null)
      window.requestAnimationFrame(() => trigger?.focus({ preventScroll: true }))
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') close()
      if (event.key === 'Tab') {
        event.preventDefault()
        closeButtonRef.current?.focus({ preventScroll: true })
      }
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [active])

  if (!active) return null

  const close = () => {
    const trigger = active.trigger
    setActive(null)
    window.requestAnimationFrame(() => trigger?.focus({ preventScroll: true }))
  }

  return (
    <div
      className="pl-image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={active.alt ? `Enlarged image: ${active.alt}` : 'Enlarged image'}
    >
      <button
        type="button"
        tabIndex={-1}
        className="pl-image-lightbox-backdrop"
        aria-label="Close enlarged image"
        onClick={close}
      />
      <button
        ref={closeButtonRef}
        type="button"
        className="pl-image-lightbox-close"
        aria-label="Close enlarged image"
        onClick={close}
      >
        <span aria-hidden="true">×</span>
      </button>
      <img src={active.src} alt={active.alt} />
    </div>
  )
}
