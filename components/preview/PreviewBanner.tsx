import Link from 'next/link'
export function PreviewBanner() {
  return (
    <div className="bg-primary p-3 text-center text-primary">
      {'Previewing drafts. '}
      <Link
        href="/api/disable-draft"
        className="hover:text-cyan underline transition-colors duration-200"
      >
        Back to published
      </Link>
    </div>
  )
}
