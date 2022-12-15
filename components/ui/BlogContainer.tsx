import type { WithChildren } from '@types'

export default function BlogContainer({ children }: WithChildren) {
  return <div className="container mx-auto px-5">{children}</div>
}
