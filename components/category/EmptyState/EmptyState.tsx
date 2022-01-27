import { NewspaperIcon } from '@heroicons/react/outline'

export default function EmptyState() {
  return (
    <div className="text-center">
      <NewspaperIcon className="mx-auto h-12 w-12 text-slate-400" />
      <h3 className="mt-2 text-sm font-medium text-slate-900">No Articles</h3>
      <p className="mt-1 text-sm text-slate-500">
        There are currently no articles for this category, please check back
        later.
      </p>
    </div>
  )
}
