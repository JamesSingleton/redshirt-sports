'use client'

import Link from 'next/link'
import { LinkIcon, Facebook, Twitter } from 'lucide-react'

export default function ArticleSocialShare({ slug, title }: { slug: string; title: string }) {
  return (
    <div className="flex flex-col gap-4 border-t border-primary pt-12 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
      <p className="text-xl font-bold">Share this post</p>
      <ul className="flex items-center justify-center gap-3 sm:justify-end">
        <li>
          <button
            aria-label="Copy link to article"
            onClick={() => {
              navigator.clipboard.writeText(`https://www.redshirtsports.xyz/${slug}`)
            }}
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary transition-all duration-200"
          >
            <LinkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </li>
        <li>
          <Link
            target="_blank"
            href={`https://twitter.com/share?url=https://www.redshirtsports.xyz/${slug}&text=${encodeURIComponent(
              title,
            )}`}
            rel="noopener"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary transition-all duration-200"
          >
            <span className="sr-only">Twitter</span>
            <Twitter className="h-5 w-5" aria-hidden="true" />
          </Link>
        </li>
        <li>
          <Link
            target="_blank"
            href={`https://www.facebook.com/sharer/sharer.php?u=https://www.redshirtsports.xyz/${slug}`}
            rel="noopener"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary transition-all duration-200"
          >
            <span className="sr-only">Facebook</span>
            <Facebook className="h-5 w-5" aria-hidden="true" />
          </Link>
        </li>
      </ul>
    </div>
  )
}
