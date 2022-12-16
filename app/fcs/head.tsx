import DefaultMetaTags from '@components/common/DefaultMetaTags'
import MetaDescription from '@components/common/MetaDescription'

export default function Head() {
  return (
    <>
      <DefaultMetaTags />
      <MetaDescription value="Check out all the coverage on NCAA Division 1 Football Championship Subdivision written by the team here at Redshirt Sports!" />
      <title>FCS Football News, Rumors, and More | Redshirt Sports</title>
      <meta property="og:title" content="FCS Football News, Rumors, and More | Redshirt Sports" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://redshirtsports.com/fcs" />
      <link rel="canonical" href="https://redshirtsports.com/fcs" />
      <link rel="next" href="https://www.redshirtsports.xyz/fcs/page/2" />
    </>
  )
}
