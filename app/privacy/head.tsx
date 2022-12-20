import DefaultMetaTags from '@components/common/DefaultMetaTags'
import MetaDescription from '@components/common/MetaDescription'

export default function Head() {
  return (
    <>
      <DefaultMetaTags />
      <title>Privacy Policy | Redshirt Sports</title>
      <meta property="og:title" content="Privacy Policy | Redshirt Sports" />
      <MetaDescription value="Redshirt Sports is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and disclose information that pertains to your privacy. Please read this Privacy Policy carefully." />
      <link rel="canonical" href="https://redshirtsports.com/privacy" />
      <meta property="og:url" content="https://redshirtsports.com/privacy" />
    </>
  )
}
