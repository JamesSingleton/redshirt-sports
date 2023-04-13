export function resolveHref(documentType?: string, slug?: string): string | undefined {
  console.log('documentType', documentType)
  console.log('slug', slug)
  switch (documentType) {
    case 'home':
      return '/'
    case 'post':
      return slug ? `/${slug}` : undefined
    case 'project':
      return slug ? `/projects/${slug}` : undefined
    default:
      console.warn('Invalid document type:', documentType)
      return undefined
  }
}
