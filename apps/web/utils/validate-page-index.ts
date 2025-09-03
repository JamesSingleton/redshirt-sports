export function validatePageIndex(page: string | string[] | undefined): number {
  if (!page) return 1

  const pageStr = Array.isArray(page) ? page[0] : page
  const parsed = parseInt(pageStr ?? '1', 10)
  if (isNaN(parsed) || parsed < 1) return 1

  return parsed
}
