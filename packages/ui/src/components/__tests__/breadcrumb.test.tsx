import { render, screen } from '@testing-library/react'

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../breadcrumb'

describe('Breadcrumb', () => {
  it('renders a nav with aria-label="breadcrumb"', () => {
    render(<Breadcrumb />)
    const nav = screen.getByRole('navigation', { name: 'breadcrumb' })
    expect(nav).toHaveAttribute('data-slot', 'breadcrumb')
  })

  it('forwards additional props to the nav element', () => {
    render(<Breadcrumb className="custom" data-testid="nav" />)
    expect(screen.getByTestId('nav')).toHaveClass('custom')
  })
})

describe('BreadcrumbList', () => {
  it('renders an ol with the correct data-slot', () => {
    const { container } = render(<BreadcrumbList />)
    const ol = container.querySelector('[data-slot="breadcrumb-list"]')!
    expect(ol.tagName).toBe('OL')
  })

  it('merges custom className', () => {
    const { container } = render(<BreadcrumbList className="custom-list" />)
    expect(container.querySelector('[data-slot="breadcrumb-list"]')).toHaveClass('custom-list')
  })
})

describe('BreadcrumbItem', () => {
  it('renders an li with the correct data-slot', () => {
    const { container } = render(<BreadcrumbItem />)
    const li = container.querySelector('[data-slot="breadcrumb-item"]')!
    expect(li.tagName).toBe('LI')
  })

  it('merges custom className', () => {
    const { container } = render(<BreadcrumbItem className="custom-item" />)
    expect(container.querySelector('[data-slot="breadcrumb-item"]')).toHaveClass('custom-item')
  })
})

describe('BreadcrumbLink', () => {
  it('renders an anchor element by default', () => {
    render(<BreadcrumbLink href="/home">Home</BreadcrumbLink>)
    const link = screen.getByRole('link', { name: 'Home' })
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', '/home')
    expect(link).toHaveAttribute('data-slot', 'breadcrumb-link')
  })

  it('renders the child element when asChild is true', () => {
    render(
      <BreadcrumbLink asChild>
        <button>Home</button>
      </BreadcrumbLink>,
    )
    const button = screen.getByRole('button', { name: 'Home' })
    expect(button.tagName).toBe('BUTTON')
    expect(button).toHaveAttribute('data-slot', 'breadcrumb-link')
  })

  it('merges custom className', () => {
    render(
      <BreadcrumbLink href="/home" className="custom-link">
        Home
      </BreadcrumbLink>,
    )
    expect(screen.getByRole('link', { name: 'Home' })).toHaveClass('custom-link')
  })
})

describe('BreadcrumbPage', () => {
  it('renders a span with aria-current="page" and aria-disabled', () => {
    render(<BreadcrumbPage>Current</BreadcrumbPage>)
    const page = screen.getByText('Current')
    expect(page.tagName).toBe('SPAN')
    expect(page).toHaveAttribute('aria-current', 'page')
    expect(page).toHaveAttribute('aria-disabled', 'true')
    expect(page).toHaveAttribute('data-slot', 'breadcrumb-page')
  })

  it('merges custom className', () => {
    render(<BreadcrumbPage className="custom-page">Current</BreadcrumbPage>)
    expect(screen.getByText('Current')).toHaveClass('custom-page')
  })
})

describe('BreadcrumbSeparator', () => {
  it('renders an li with role="presentation" and aria-hidden', () => {
    const { container } = render(<BreadcrumbSeparator />)
    const sep = container.querySelector('[data-slot="breadcrumb-separator"]')!
    expect(sep.tagName).toBe('LI')
    expect(sep).toHaveAttribute('role', 'presentation')
    expect(sep).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders ChevronRight icon by default', () => {
    const { container } = render(<BreadcrumbSeparator />)
    const sep = container.querySelector('[data-slot="breadcrumb-separator"]')!
    expect(sep.querySelector('svg')).not.toBeNull()
  })

  it('renders custom children in place of the default icon', () => {
    const { container } = render(<BreadcrumbSeparator>/</BreadcrumbSeparator>)
    const sep = container.querySelector('[data-slot="breadcrumb-separator"]')!
    expect(sep.querySelector('svg')).toBeNull()
    expect(sep.textContent).toBe('/')
  })

  it('merges custom className', () => {
    const { container } = render(<BreadcrumbSeparator className="custom-sep" />)
    expect(container.querySelector('[data-slot="breadcrumb-separator"]')).toHaveClass('custom-sep')
  })
})

describe('BreadcrumbEllipsis', () => {
  it('renders a span with role="presentation" and aria-hidden', () => {
    const { container } = render(<BreadcrumbEllipsis />)
    const ellipsis = container.querySelector('[data-slot="breadcrumb-ellipsis"]')!
    expect(ellipsis.tagName).toBe('SPAN')
    expect(ellipsis).toHaveAttribute('role', 'presentation')
    expect(ellipsis).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders the MoreHorizontal icon', () => {
    const { container } = render(<BreadcrumbEllipsis />)
    const ellipsis = container.querySelector('[data-slot="breadcrumb-ellipsis"]')!
    expect(ellipsis.querySelector('svg')).not.toBeNull()
  })

  it('contains a screen-reader-only "More" label', () => {
    render(<BreadcrumbEllipsis />)
    expect(screen.getByText('More')).toHaveClass('sr-only')
  })

  it('merges custom className', () => {
    const { container } = render(<BreadcrumbEllipsis className="custom-ellipsis" />)
    expect(container.querySelector('[data-slot="breadcrumb-ellipsis"]')).toHaveClass(
      'custom-ellipsis',
    )
  })
})

describe('Breadcrumb — composed trail', () => {
  function renderTrail() {
    return render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbEllipsis />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/docs">Docs</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Components</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    )
  }

  it('renders the nav container with accessible label', () => {
    renderTrail()
    expect(screen.getByRole('navigation', { name: 'breadcrumb' })).toBeInTheDocument()
  })

  it('renders links with correct hrefs', () => {
    renderTrail()
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs')
  })

  it('marks the current page with aria-current', () => {
    renderTrail()
    expect(screen.getByText('Components')).toHaveAttribute('aria-current', 'page')
  })

  it('includes the ellipsis with a screen-reader label', () => {
    renderTrail()
    expect(screen.getByText('More')).toHaveClass('sr-only')
  })

  it('renders links in document order', () => {
    const { container } = renderTrail()
    const links = container.querySelectorAll('a')
    expect(links).toHaveLength(2)
    expect(links[0]!).toHaveAttribute('href', '/')
    expect(links[1]!).toHaveAttribute('href', '/docs')
  })
})
