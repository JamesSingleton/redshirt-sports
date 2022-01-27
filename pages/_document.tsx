import Document, { Head, Html, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en-US" className="h-full">
        <Head>
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=optional"
            rel="stylesheet"
          />
        </Head>
        <body className="loading bg-white text-slate-600 antialiased dark:bg-slate-900 dark:text-slate-200">
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
