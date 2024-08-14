'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LinkIcon, CheckIcon } from 'lucide-react'

import { Facebook, Twitter } from '@/components/common/icons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { HOME_DOMAIN } from '@/lib/constants'

const shareArticle = ({
  platform,
  url,
  title,
}: {
  platform: 'facebook' | 'twitter'
  url: string
  title: string
}) => {
  let shareUrl = ''
  switch (platform) {
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
      break
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
      break
  }
  window.open(shareUrl, '_blank', 'noopener,noreferrer')
}

const ShareButtons = ({ url, title }: { url: string; title: string }) => (
  <>
    <Button
      variant="outline"
      size="icon"
      onClick={() =>
        shareArticle({
          platform: 'twitter',
          url,
          title,
        })
      }
    >
      <Twitter className="h-5 w-5" />
      <span className="sr-only">Share on X</span>
    </Button>
    <Button
      variant="outline"
      size="icon"
      onClick={() =>
        shareArticle({
          platform: 'facebook',
          url,
          title,
        })
      }
    >
      <Facebook className="h-5 w-5" />
      <span className="sr-only">Share on Facebook</span>
    </Button>
  </>
)

export const LargeArticleSocialShare = ({ slug, title }: { slug: string; title: string }) => {
  const [copied, setCopied] = useState(false)
  const articleUrl = `${HOME_DOMAIN}/${slug}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(articleUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Card className="mt-8 hidden w-full lg:block">
      <CardHeader>
        <CardTitle className="text-lg">Share this article</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="card-article-url" className="text-sm text-gray-400">
            Article URL
          </Label>
          <div className="flex gap-2">
            <Input id="card-article-url" value={articleUrl} readOnly />
            <Button onClick={copyToClipboard}>
              <LinkIcon className="mr-2 h-4 w-4" />
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>
        <div className="flex justify-start gap-2">
          <ShareButtons url={articleUrl} title={title} />
        </div>
      </CardContent>
    </Card>
  )
}

export const SmallArticleSocialShare = ({ slug, title }: { slug: string; title: string }) => {
  const [copied, setCopied] = useState(false)
  const articleUrl = `${HOME_DOMAIN}/${slug}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(articleUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="mt-8 w-full px-4 lg:hidden">
      <h2 className="mb-4 text-lg font-semibold">Share this article</h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="inline-article-url">Article URL</Label>
          <div className="flex gap-2">
            <Input id="inline-article-url" value={articleUrl} readOnly />
            <Button onClick={copyToClipboard}>
              <LinkIcon className="mr-2 h-4 w-4" />
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </div>
        <div className="flex justify-start gap-2">
          <ShareButtons url={articleUrl} title={title} />
        </div>
      </div>
    </div>
  )
}
