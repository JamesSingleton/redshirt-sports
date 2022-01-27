import { FC } from 'react'

interface CategoryHeaderProps {
  heading: string
  subHeading: string
}

const CategoryHeader: FC<CategoryHeaderProps> = ({ heading, subHeading }) => (
  <div className="relative mb-6 flex flex-col justify-between sm:flex-row sm:items-end md:mb-8">
    <div className="max-w-2xl">
      <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50 md:text-4xl">
        {heading}
      </h1>
      <span className="mt-2 block text-base font-normal sm:text-xl md:mt-3">
        {subHeading}
      </span>
    </div>
  </div>
)

export default CategoryHeader
