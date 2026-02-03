import { type ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { sanityFetch } from '@redshirt-sports/sanity/live'

import HomePage from '../page'

vi.mock('@redshirt-sports/sanity/live', () => ({
  sanityFetch: vi.fn(),
}))

vi.mock('@redshirt-sports/sanity/queries', () => ({
  queryHomePageData: 'mock-home',
  queryLatestArticles: 'mock-latest',
  queryLatestCollegeSportsArticles: 'mock-college',
}))

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
    className,
  }: {
    children: ReactNode
    href: string
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

vi.mock('@/components/home/hero', () => ({
  __esModule: true,
  default: () => <div data-testid="hero" />,
}))

vi.mock('@/components/article-card', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <div data-testid="article-card">{title}</div>,
}))

vi.mock('@/components/article-section', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <div data-testid="article-section">{title}</div>,
}))

vi.mock('@/components/json-ld', () => ({
  JsonLdScript: () => null,
  organizationId: 'org-id',
  websiteId: 'website-id',
}))

vi.mock('@/lib/get-base-url', () => ({
  getBaseUrl: () => 'http://localhost',
}))

vi.mock('@/lib/seo', () => ({
  getSEOMetadata: () => ({}),
}))

const mockFetch = sanityFetch as vi.Mock

beforeEach(() => {
  mockFetch.mockResolvedValue({ data: [] })
})

describe('HomePage', () => {
  it('renders the hero and four division sections when no articles exist', async () => {
    const page = await HomePage()
    render(page)

    expect(screen.getByTestId('hero')).toBeInTheDocument()
    expect(screen.queryByText('Latest News')).not.toBeInTheDocument()
    expect(screen.getByText('FBS College Football News')).toBeInTheDocument()
    expect(screen.getByText('FCS College Football News')).toBeInTheDocument()
    expect(screen.getByText('Division II Football News')).toBeInTheDocument()
    expect(screen.getByText('Division III Football News')).toBeInTheDocument()
  })

  it('renders the Latest News section and article cards when articles exist', async () => {
    const article = {
      _id: '1',
      title: 'Test Article',
      publishedAt: '2026-01-01T00:00:00Z',
      mainImage: null,
      slug: 'test-article',
      authors: [{ name: 'Test Author' }],
    }

    mockFetch
      .mockResolvedValueOnce({ data: [article] }) // homePageData
      .mockResolvedValueOnce({ data: [article] }) // latestArticles
    // remaining 4 division calls fall through to the beforeEach default

    const page = await HomePage()
    render(page)

    expect(screen.getByText('Latest News')).toBeInTheDocument()
    expect(screen.getByText('Test Article')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View All/ })).toHaveAttribute('href', '/college/news')
  })
})
