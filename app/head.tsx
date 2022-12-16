import DefaultMetaTags from '@components/common/DefaultMetaTags'
import MetaDescription from '@components/common/MetaDescription'
import seoConfig from '@config/seo.json'

export default function Head() {
  return (
    <>
      <title>FCS Football News, Standings, Rumors | Redshirt Sports</title>
      <DefaultMetaTags />
      <MetaDescription value={seoConfig.description} />
      <meta property="og:title" content="FCS Football News, Standings, Rumors | Redshirt Sports" />
      <meta property="og:type" content="website" />
    </>
  )
}
