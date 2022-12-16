import { Breadcrumbs } from '@components/ui'

interface CategoryHeaderProps {
  title: string
  aboveTitle: string
  breadCrumbPages: {
    name: string
    href: string
  }[]
}

const CategoryHeader = ({ title, aboveTitle, breadCrumbPages }: CategoryHeaderProps) => (
  <section className="bg-slate-50 py-12 sm:py-20 lg:py-24">
    <div className="mx-auto max-w-xl px-4 sm:px-12 md:max-w-3xl lg:max-w-7xl lg:px-8">
      <div className="flex w-full flex-col items-center md:flex-row md:justify-between">
        <div className="order-2 mt-8 flex flex-col items-center md:order-1 md:mt-0 md:flex-row">
          <div className="mt-6 text-center md:mt-0 md:text-left">
            <span className="block font-archivoNarrow text-xs uppercase tracking-widest text-brand-500">
              {aboveTitle}
            </span>
            <h1 className="mt-1 font-sans text-3xl font-black tracking-normal text-slate-900 sm:text-4xl md:tracking-wider lg:text-5xl lg:leading-tight">
              {title}
            </h1>
          </div>
        </div>
        <div className="order-1 md:order-2">
          <Breadcrumbs breadCrumbPages={breadCrumbPages} />
        </div>
      </div>
    </div>
  </section>
)

export default CategoryHeader
