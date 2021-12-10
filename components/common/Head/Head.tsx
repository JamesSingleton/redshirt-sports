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
        <link
          rel="shortcut icon"
          type="image/png"
          href="/images/icons/RS_192.png"
        />
        <link rel="manifest" href="/manifest.webmanifest" key="site-manifest" />
        <meta name="theme-color" content="#DC2727" />
      </NextHead>
    </>
  )
}

export default Head
