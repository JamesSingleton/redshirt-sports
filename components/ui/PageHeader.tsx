import { ReactNode } from 'react'

interface PageHeaderProps {
  heading: string
  subheading: string | ReactNode
}

const PageHeader = ({ heading, subheading }: PageHeaderProps) => (
  <section className="bg-zinc-100 py-12 dark:bg-zinc-800 sm:py-16 md:py-20 lg:py-24">
    <div className="mx-auto max-w-xl px-5 sm:px-8 md:max-w-2xl lg:max-w-7xl">
      <div className="max-w-xl">
        <h1 className="font-cal text-4xl font-medium tracking-normal md:tracking-tight lg:text-5xl lg:leading-tight">
          {heading}
        </h1>
        {subheading && (
          <p className="my-3 text-lg text-zinc-500 dark:text-zinc-400">{subheading}</p>
        )}
      </div>
    </div>
  </section>
)

export default PageHeader
