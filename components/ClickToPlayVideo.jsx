'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { hrefWithBase } from '../app/site-config.mjs'

function formatTime(seconds) {
  const safe = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`
}

// Animated infographic that rests on its finished picture and plays on click, with
// a small control row underneath (play/pause and a scrub bar) so readers can stop
// on any moment and replay it. Each video is encoded with the finished picture as
// its first frame, so the resting state and the end of playback both come from the
// video itself: a separate poster image would go through the browser's color
// management and show up slightly darker and with visible banding in dark
// gradients. For the same reason the video has no poster attribute (browsers keep
// showing it until playback starts) and the #t=0.001 fragment makes browsers paint
// frame 0 right after loading. The poster prop in the MDX is only read by the
// markdown mirror script. Reuses the article media wrapper (.pl-content-image)
// so spacing and the dark mode ring match static images. The description is
// rendered as visually hidden text so screen readers and Pagefind keep the same
// alt text the still image had.
export function ClickToPlayVideo({ src, alt, width = 1600, height = 990 }) {
  const videoRef = useRef(null)
  const wrapperRef = useRef(null)
  const descriptionId = useId()
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)

  // Track fullscreen changes, including Esc and the browser's own exit controls.
  useEffect(() => {
    const onChange = () => {
      const current = document.fullscreenElement || document.webkitFullscreenElement
      setFullscreen(Boolean(current) && current === wrapperRef.current)
    }
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [])

  // Metadata can arrive before hydration, so read it once on mount as well.
  useEffect(() => {
    const video = videoRef.current
    if (video && video.readyState >= 1 && Number.isFinite(video.duration)) {
      setDuration(video.duration)
    }
  }, [])

  // Follow playback on every frame so the scrub bar moves smoothly.
  useEffect(() => {
    if (!playing) return undefined
    let frame = 0
    const tick = () => {
      const video = videoRef.current
      if (video) setTime(video.currentTime)
      frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [playing])

  function toggle() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) video.play().catch(() => setPlaying(false))
    else video.pause()
  }

  // Fullscreen covers the frame and the controls together, so play, pause and
  // scrubbing keep working. iPhone Safari has no element fullscreen, so it falls
  // back to the native video player there.
  function toggleFullscreen() {
    const wrapper = wrapperRef.current
    const video = videoRef.current
    if (!wrapper) return
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      ;(document.exitFullscreen || document.webkitExitFullscreen)?.call(document)
      return
    }
    if (wrapper.requestFullscreen) wrapper.requestFullscreen().catch(() => {})
    else if (wrapper.webkitRequestFullscreen) wrapper.webkitRequestFullscreen()
    else if (video?.webkitEnterFullscreen) video.webkitEnterFullscreen()
  }

  function handleSeek(event) {
    const video = videoRef.current
    const next = Number(event.target.value)
    if (video) video.currentTime = next
    setTime(next)
  }

  function handleEnded() {
    const video = videoRef.current
    // Frame 0 is the finished picture, so rewinding restores the resting state.
    if (video) video.currentTime = 0
    setTime(0)
    setPlaying(false)
  }

  const progress = duration > 0 ? Math.min(100, (time / duration) * 100) : 0

  return (
    <div ref={wrapperRef} className="pl-content-image pl-content-video">
      <span className="pl-content-image-frame pl-video-frame">
        <video
          ref={videoRef}
          className="pl-video"
          src={`${hrefWithBase(src)}#t=0.001`}
          width={width}
          height={height}
          preload="metadata"
          playsInline
          muted
          disablePictureInPicture
          disableRemotePlayback
          aria-hidden="true"
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={handleEnded}
        />
        {/* Pointer shortcut only: the labelled controls below are the accessible path. */}
        <button
          type="button"
          className="pl-video-hit"
          tabIndex={-1}
          aria-hidden="true"
          onClick={toggle}
        />
        <span id={descriptionId} className="pl-video-description">
          {alt}
        </span>
      </span>
      <div className="pl-video-controls">
        <button
          type="button"
          className="pl-video-toggle"
          aria-label={playing ? 'Pause animation' : 'Play animation'}
          aria-describedby={descriptionId}
          onClick={toggle}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
            {playing ? (
              <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" />
            ) : (
              <path
                d="M8 5.5v13a.75.75 0 0 0 1.14.64l10.4-6.5a.75.75 0 0 0 0-1.28L9.14 4.86A.75.75 0 0 0 8 5.5z"
                fill="currentColor"
              />
            )}
          </svg>
        </button>
        <input
          type="range"
          className="pl-video-scrub"
          min="0"
          max={duration || 0}
          step="0.01"
          value={Math.min(time, duration || 0)}
          disabled={!duration}
          aria-label="Animation position"
          aria-valuetext={`${formatTime(time)} of ${formatTime(duration)}`}
          style={{ '--pl-video-progress': `${progress}%` }}
          onChange={handleSeek}
        />
        <span className="pl-video-time" aria-hidden="true">
          {formatTime(time)} / {formatTime(duration)}
        </span>
        <button
          type="button"
          className="pl-video-toggle pl-video-fullscreen"
          aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}
          aria-pressed={fullscreen}
          onClick={toggleFullscreen}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
            <path
              d={
                fullscreen
                  ? 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5'
                  : 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5'
              }
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
