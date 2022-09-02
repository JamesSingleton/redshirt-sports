import Document, { Head, Html, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en-US">
        <Head>
          <link rel="preload" href="/fonts/CalSans-SemiBold.woff2" as="font" type="font/woff2" />
        </Head>
        <body className="loading bg-white text-slate-600 antialiased">
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
