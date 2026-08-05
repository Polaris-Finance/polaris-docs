'use client'

import { useEffect, useRef, useState } from 'react'
import { LiquidMetal } from '@paper-design/shaders-react'

export function LiquidMetalSymbol({ image }) {
  const [reduceMotion, setReduceMotion] = useState(false)
  const [shaderReady, setShaderReady] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotionPreference = () => setReduceMotion(media.matches)

    updateMotionPreference()
    media.addEventListener('change', updateMotionPreference)

    return () => media.removeEventListener('change', updateMotionPreference)
  }, [])

  useEffect(() => {
    let animationFrame = 0
    let attempts = 0

    const detectProcessedTexture = () => {
      const shaderHost = rootRef.current?.querySelector('.pl-docs-liquid-metal-canvas')
      const texture = shaderHost?.paperShaderMount?.providedUniforms?.u_image

      if (texture?.src?.startsWith('blob:') && texture.complete) {
        setShaderReady(true)
        return
      }

      attempts += 1
      if (attempts < 300) {
        animationFrame = window.requestAnimationFrame(detectProcessedTexture)
      }
    }

    animationFrame = window.requestAnimationFrame(detectProcessedTexture)
    return () => window.cancelAnimationFrame(animationFrame)
  }, [image])

  return (
    <span
      ref={rootRef}
      className="pl-docs-liquid-metal"
      data-shader-ready={shaderReady ? '' : undefined}
      style={{ '--pl-liquid-metal-fallback': `url("${image}")` }}
      aria-hidden="true"
    >
      <LiquidMetal
        speed={reduceMotion ? 0 : 0.62}
        softness={0.1}
        repetition={2}
        shiftRed={0.3}
        shiftBlue={0.3}
        distortion={0.07}
        contour={0.4}
        scale={0.6}
        rotation={0}
        shape="diamond"
        angle={70}
        image={image}
        frame={335652.4230000146}
        colorBack="#00000000"
        colorTint="#ADAEC7"
        className="pl-docs-liquid-metal-canvas"
        style={{ backgroundColor: 'transparent', flexShrink: 0, height: 100, width: 100 }}
      />
    </span>
  )
}
