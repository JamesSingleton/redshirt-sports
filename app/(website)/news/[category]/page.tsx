import { getCategoryBySlug } from '@lib/sanity.client'
import { getPreviewToken } from '@lib/sanity.server.preview'

import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: { category: string }
}): Promise<Metadata> {
  const token = getPreviewToken()
  const category = await getCategoryBySlug({ slug: params.category, token })
  return {
    title: `${category?.pageHeader}, Rumors, and More`,
    description: category?.description,
  }
}

export default async function Page({
  params,
  searchParams,
}: {
  params: { category: string }
  searchParams: { [key: string]: string }
}) {
  const token = getPreviewToken()
  const category = await getCategoryBySlug({ slug: params.category, token })

  return (
    <>
      <section className="bg-slate-50 py-12 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-xl px-4 sm:px-12 md:max-w-3xl lg:max-w-7xl lg:px-8">
          <div className="flex w-full flex-col items-center md:flex-row md:justify-between">
            <div className="order-2 mt-8 flex flex-col items-center md:order-1 md:mt-0 md:flex-row">
              <div className="mt-6 text-center md:mt-0 md:text-left">
                {category?.pageHeader && (
                  <span className="block text-xs uppercase tracking-widest text-brand-500">
                    {category?.subTitle}
                  </span>
                )}
                <h1 className="mt-1 font-cal text-3xl font-medium tracking-normal text-slate-900 sm:text-4xl md:tracking-wider lg:text-5xl lg:leading-tight">
                  {category?.pageHeader}
                </h1>
              </div>
            </div>
            <div className="order-1 md:order-2">Breadcrumbs Here</div>
          </div>
        </div>
      </section>
      {Object.keys(searchParams).map((key) => (
        <p key={key}>
          {key}: {searchParams[key]}
        </p>
      ))}
    </>
  )
}
