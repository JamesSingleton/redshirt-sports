import Document, { Head, Html, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  render() {
    const ADSENSE_ID = process.env.NEXT_PUBLIC_ADSENSE_ID
    return (
      <Html lang="en-US" className="h-full bg-gray-100">
        <Head>
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?${ADSENSE_ID}`}
          />
        </Head>
        <body className="loading">
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
