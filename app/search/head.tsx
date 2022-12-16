import DefaultMetaTags from '@components/common/DefaultMetaTags'
import MetaDescription from '@components/common/MetaDescription'

export default function Head() {
  return (
    <>
      <DefaultMetaTags />
      <title>Search Results | Redshirt Sports</title>
      <MetaDescription value="Search Results for Redshirt Sports" />
      <meta property="og:title" content="Search Results | Redshirt Sports" />
    </>
  )
}
