import Link from 'next/link'

export default async function NotFoundPage() {
  return (
    <section>
      <div className="container mx-auto flex min-h-screen items-center px-6 py-12">
        <div className="mx-auto flex max-w-sm flex-col items-center text-center">
          <p className="rounded-full bg-brand-50 p-3 text-sm font-medium text-brand-500 dark:bg-zinc-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </p>
          <h1 className="mt-3 text-2xl font-semibold md:text-3xl">Page not found</h1>
          <p className="mt-4 text-zinc-500 dark:text-zinc-400">
            The page you are looking for doesn&apos;t exist. Here are some helpful links:
          </p>

          <div className="mt-6 flex w-full shrink-0 items-center gap-x-3 sm:w-auto">
            <Link
              href="/"
              className="w-1/2 shrink-0 rounded-lg bg-brand-500 px-5 py-2 text-sm tracking-wide text-white transition-colors duration-200 hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-500 sm:w-auto"
            >
              Take me home
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
