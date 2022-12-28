import DefaultMetaTags from '@components/common/DefaultMetaTags'
import MetaDescription from '@components/common/MetaDescription'

export default function Head() {
  return (
    <>
      <title>FBS Football News, Standings, Rumors | Redshirt Sports</title>
      <DefaultMetaTags />
      <MetaDescription value="Check out all the coverage on NCAA Division 1 Football Bowl Subdivision written by the team here at Redshirt Sports!" />
      <meta property="og:title" content="FBS Football News, Standings, Rumors | Redshirt Sports" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://redshirtsports.com/fbs" />
      <link rel="canonical" href="https://redshirtsports.com/fbs" />
    </>
  )
}
