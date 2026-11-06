"use client";

import { analytics } from "@redshirt-sports/analytics";
import { Play } from "lucide-react";
import { useState } from "react";

interface YouTubeEmbedProps {
  url: string;
  autoplay?: boolean;
  className?: string;
  description?: string;
  height?: number | string;
  requireConsent?: boolean;
  thumbnail?: string;
  title?: string;
  width?: number | string;
}

// Shorts must be matched first: the general pattern would otherwise capture
// "shorts/<id>" as the video ID.
const VIDEO_ID_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^&\n?#/]+)/,
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|.+\?v=)?([^&\n?#]+)/,
];

function getVideoId(videoUrl: string) {
  if (!videoUrl) return null;

  for (const pattern of VIDEO_ID_PATTERNS) {
    const match = videoUrl.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Click-to-load YouTube player.
 *
 * Nothing is requested from YouTube/Google until the reader clicks play, so
 * no third-party cookies or tracking load with the page. After the click the
 * video loads from youtube-nocookie.com.
 */
export function YouTubeEmbedComponent({
  url,
  autoplay = false,
  className = "",
  title = "YouTube video",
}: YouTubeEmbedProps) {
  const [activated, setActivated] = useState(autoplay);
  const videoId = getVideoId(url);

  if (!videoId) {
    return (
      <div className="flex h-64 items-center justify-center border-2 border-dashed border-zinc-300 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800">
        <div className="text-center">
          <p className="mb-2 text-zinc-600 dark:text-zinc-400">
            Invalid YouTube URL
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            Please provide a valid YouTube video URL
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`not-prose my-6 w-full ${className}`}>
      <div
        className="relative w-full overflow-hidden bg-zinc-900"
        style={{ aspectRatio: "16/9" }}
      >
        {activated ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              analytics?.capture("video_played", {
                video_id: videoId,
                video_title: title,
                page_path: window.location.pathname,
              });
              setActivated(true);
            }}
            className="group absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-3 text-white focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white"
            aria-label={`Play video: ${title}`}
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30 transition group-hover:scale-105 group-hover:bg-white/25">
              <Play className="ml-1 size-7 fill-current" aria-hidden="true" />
            </span>
            <span className="max-w-md px-6 text-center text-sm text-zinc-200">
              Click to play. The video loads from YouTube when you do.
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
