'use client'

import { Suspense, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const ReactPlayer = dynamic(() => import('react-player'), {
  loading: () => (
    <div
      className="relative flex w-full items-center justify-center overflow-hidden border-2 border-dashed border-zinc-300 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800"
      style={{ aspectRatio: '16/9' }}
    >
      <p className="text-sm text-zinc-500 dark:text-zinc-500">Loading video player...</p>
    </div>
  ),
  ssr: false,
})

interface YouTubeEmbedProps {
  url: string
  autoplay?: boolean
  className?: string
  description?: string
  height?: number | string
  requireConsent?: boolean
  thumbnail?: string
  title?: string
  width?: number | string
}

export function YouTubeEmbedComponent({
  url,
  autoplay = false,
  className = '',
  height,
  width,
}: YouTubeEmbedProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Get video ID from YouTube URL for thumbnail
  const getVideoId = (videoUrl: string) => {
    if (!videoUrl) return null

    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|.+\?v=)?([^&\n?#]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^&\n?#]+)/,
    ]

    for (const pattern of patterns) {
      const match = videoUrl.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return null
  }

  const videoId = getVideoId(url)

  // Show error state for invalid URLs
  if (!videoId) {
    return (
      <div className="flex h-64 items-center justify-center border-2 border-dashed border-zinc-300 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800">
        <div className="text-center">
          <p className="mb-2 text-zinc-600 dark:text-zinc-400">Invalid YouTube URL</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            Please provide a valid YouTube video URL
          </p>
        </div>
      </div>
    )
  }

  // Show loading state during SSR and initial hydration
  if (!isMounted) {
    return (
      <div className={`w-full ${className}`}>
        <div className="space-y-4">
          <div
            className="relative flex w-full items-center justify-center overflow-hidden border-2 border-dashed border-zinc-300 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800"
            style={{ aspectRatio: '16/9' }}
          >
            <p className="text-sm text-zinc-500 dark:text-zinc-500">Loading video player...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`not-prose my-6 w-full ${className}`}>
      <div className="relative overflow-hidden">
        <Suspense
          fallback={
            <div
              className="relative flex w-full items-center justify-center overflow-hidden border-2 border-dashed border-zinc-300 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800"
              style={{ aspectRatio: '16/9' }}
            >
              <p className="text-sm text-zinc-500 dark:text-zinc-500">Loading video player...</p>
            </div>
          }
        >
          <ReactPlayer
            src={url}
            controls
            playing={autoplay}
            style={{ aspectRatio: '16/9', height: 'auto', width: '100%' }}
            width={width}
            height={height}
          />
        </Suspense>
      </div>
    </div>
  )
}
