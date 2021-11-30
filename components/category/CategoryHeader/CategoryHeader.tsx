import { FC } from 'react'

interface CategoryHeaderProps {
  heading: string
  subHeading: string
}

const CategoryHeader: FC<CategoryHeaderProps> = ({ heading, subHeading }) => (
  <div className="pb-6 border-b border-gray-300">
    <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-4xl sm:truncate">
      {heading}
    </h1>
    <div className="mt-1 sm:mt-0 text-gray-500">{subHeading}</div>
  </div>
)

export default CategoryHeader
