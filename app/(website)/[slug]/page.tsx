import { getPageBySlug } from '@lib/sanity.client'
import { getPreviewToken } from '@lib/sanity.server.preview'

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: URLSearchParams
}) {
  return {
    openGraph: {
      type: 'article',
    },
  }
}

export default async function Page({ params }: { params: { slug: string } }) {
  const { slug } = params
  const token = getPreviewToken()
  const post = await getPageBySlug({ token, slug })
  console.log(post)
  return (
    <>
      <article className="lg:pb-25 bg-slate-50 pb-12 sm:pb-16">
        <div className="px-5 lg:px-0"></div>
      </article>
      <section className="mx-auto w-full max-w-7xl pb-14 pt-12 sm:py-20 lg:pt-24">
        <div className="mx-auto max-w-xl px-4 sm:max-w-3xl sm:px-6 md:px-8 lg:max-w-screen-2xl">
          <h2 className="relative border-b border-slate-300 pb-2 font-cal text-2xl font-medium text-slate-900 before:absolute before:-bottom-[1px] before:left-0 before:h-px before:w-24 before:bg-brand-500">
            Related Articles
          </h2>
        </div>
        <div className="mx-auto mt-12 grid max-w-lg gap-5 lg:max-w-none lg:grid-cols-3"></div>
      </section>
    </>
  )
}
