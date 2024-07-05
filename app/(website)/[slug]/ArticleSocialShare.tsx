'use client'

import Link from 'next/link'
import { LinkIcon } from 'lucide-react'

import { Facebook, Twitter } from '@/components/common/icons'
import { BASE_URL } from '@/lib/constants'

export default function ArticleSocialShare({ slug, title }: { slug: string; title: string }) {
  return (
    <div className="flex flex-col gap-4 border-t border-primary pt-12 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
      <p className="text-xl font-bold">Share this post</p>
      <ul className="flex items-center justify-center gap-3 sm:justify-end">
        <li className="group">
          <button
            aria-label="Copy link to article"
            onClick={() => {
              navigator.clipboard.writeText(`${BASE_URL}/${slug}`)
            }}
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary transition-all duration-200 group-hover:bg-primary"
          >
            <LinkIcon className="h-5 w-5 group-hover:text-secondary" aria-hidden="true" />
          </button>
        </li>
        <li className="group">
          <Link
            target="_blank"
            href={`https://x.com/share?url=${BASE_URL}/${slug}&text=${encodeURIComponent(title)}`}
            rel="noopener"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary transition-all duration-200 group-hover:bg-primary"
          >
            <span className="sr-only">X (Formerly Twitter)</span>
            <Twitter
              className="h-5 w-5 group-hover:fill-secondary group-hover:text-secondary"
              aria-hidden="true"
            />
          </Link>
        </li>
        <li className="group">
          <Link
            target="_blank"
            href={`https://www.facebook.com/sharer/sharer.php?u=${BASE_URL}/${slug}`}
            rel="noopener"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary transition-all duration-200 group-hover:bg-primary"
          >
            <span className="sr-only">Facebook</span>
            <Facebook
              className="h-5 w-5 group-hover:fill-secondary group-hover:text-secondary"
              aria-hidden="true"
            />
          </Link>
        </li>
      </ul>
    </div>
  )
}
