import { FC } from 'react'

interface CategoryHeaderProps {
  heading: string
  subHeading: string
}

const CategoryHeader: FC<CategoryHeaderProps> = ({ heading, subHeading }) => (
  <div className="relative flex flex-col sm:flex-row sm:items-end justify-between mb-6 md:mb-8">
    <div className="max-w-2xl">
      <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 dark:text-slate-50">
        {heading}
      </h1>
      <span className="mt-2 md:mt-3 font-normal block text-base sm:text-xl">
        {subHeading}
      </span>
    </div>
  </div>
)

export default CategoryHeader
