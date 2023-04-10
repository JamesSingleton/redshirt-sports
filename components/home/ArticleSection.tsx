import VerticalArticleCard from '@components/ui/VerticalArticleCard'
import { getOtherArticles } from '@lib/sanity.client'
import { getPreviewToken } from '@lib/sanity.server.preview'

const ArticleSection = async () => {
  const token = getPreviewToken()
  const otherArticles = await getOtherArticles({ token })
  return (
    <div className="mx-auto grid max-w-xl gap-6 px-4 sm:px-6 md:max-w-3xl md:grid-cols-2 md:px-8 lg:max-w-none lg:px-0">
      {otherArticles!.map((post) => (
        <VerticalArticleCard article={post} key={post._id} />
      ))}
    </div>
  )
}

export default ArticleSection
