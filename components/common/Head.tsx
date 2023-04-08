import { SEO } from '@components/common'

const Head = () => (
  <SEO>
    <link rel="manifest" href="/site.webmanifest" key="site-manifest" />
    <meta key="theme-color" name="theme-color" content="#DC2727" />
    <link
      key="rss-2.0"
      title="RSS 2.0"
      rel="alternate"
      type="application/rss+xml"
      href="/feeds/feed.xml"
    />
    <link
      key="atom-1.0"
      title="Atom 1.0"
      rel="alternate"
      type="application/atom+xml"
      href="/feeds/atom.xml"
    />
    <link
      key="json-feed"
      title="JSON Feed"
      rel="alternate"
      type="application/json"
      href="/feeds/feed.json"
    />
    <link rel="icon" href="/favicon.ico" key="favicon" />
    <link rel="apple-touch-icon" href="/images/icons/RS_192.png" key="apple-touch-icon" />
  </SEO>
)

export default Head
