/* eslint-disable @next/next/no-html-link-for-pages */
import Container from './BlogContainer'

export default function Alert({ preview, loading }: { preview?: boolean; loading?: boolean }) {
  if (!preview) return null

  return (
    <div className="border-accent-7 bg-accent-7 border-b text-white">
      <Container>
        <div className="py-2 text-center text-sm">
          {loading ? 'Loading... ' : 'This page is a preview. '}
          <a
            href="/api/exit-preview"
            className="hover:text-cyan underline transition-colors duration-200"
          >
            Click here
          </a>{' '}
          to exit preview mode.
        </div>
      </Container>
    </div>
  )
}
