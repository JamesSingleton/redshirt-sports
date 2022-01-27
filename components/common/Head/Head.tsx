import { FC } from 'react'
import NextHead from 'next/head'
import { DefaultSeo } from 'next-seo'
import config from '@config/seo.json'

const Head: FC = () => {
  return (
    <>
      <DefaultSeo {...config} />
      <NextHead>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.webmanifest" key="site-manifest" />
        <meta name="theme-color" content="#DC2727" />
        <link
          rel="alternate"
          type="application/rss+xml"
          title="RSS 2.0"
          href="/feeds/feed.xml"
        />
        <link
          rel="alternate"
          type="application/atom+xml"
          title="Atom 1.0"
          href="/feeds/atom.xml"
        />
        <link
          rel="alternate"
          type="application/json"
          title="JSON Feed"
          href="/feeds/feed.json"
        />
      </NextHead>
    </>
  )
}

export default Head
