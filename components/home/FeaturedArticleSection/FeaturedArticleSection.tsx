import { FC } from 'react'
import FeaturedArticle from '../FeaturedArticle'

const FeaturedArticleSection: FC = () => {
  return (
    <div className="sticky top-4 space-y-4">
      <FeaturedArticle
        title="Featured FCS"
        imageSrc="https://vmikeydets.com/images/2021/10/2/8CS_8745.JPG?width=1920&quality=80&format=jpg"
        imageAlt="VMI vs The Citadel"
        articleTitle="VMI falls to rival The Citadel 35-24 in Military Classic of the South"
        articleHref="/fcs/vmi-vs-the-citadel"
        articleSnippet="The Bulldogs had six pass attempts with only two completions. But their was certainly damage done on the ground--363 yards and 4 touchdowns."
      />
      <FeaturedArticle
        title="Featured FBS"
        imageSrc="https://images2.minutemediacdn.com/image/fetch/w_736,h_485,c_fill,g_auto,f_auto/https%3A%2F%2Fsaturdayblitz.com%2Fwp-content%2Fuploads%2Fgetty-images%2F2016%2F04%2F1180138685-850x560.jpeg"
        imageAlt="Arkansas State"
        articleTitle="Vols won't impose bowl ban, await NCAA ruling"
        articleHref="/fbs/tennesse-vols"
        articleSnippet="The University of Tennessee has concluded its year-long internal investigation into rules violations within the football program that led to the firing of head football coach Jeremy Pruitt and will not self-impose a bowl ban, the university announced Thursday."
      />
    </div>
  )
}

export default FeaturedArticleSection
