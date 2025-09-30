import Link from 'next/link'
import { CameraIcon } from 'lucide-react'
import {
  PortableText,
  type PortableTextReactComponents,
  type PortableTextBlock,
  PortableTextMarkComponentProps,
} from 'next-sanity'
import { cn } from '@redshirt-sports/ui/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@redshirt-sports/ui/components/table'

import { ReactTweet as Tweet } from '@/components/tweet'
import CustomImage from '@/components/sanity-image'
import { YouTubeEmbedComponent } from './youtube-embed'

type TableType = {
  _type: 'table'
  _key: string
  rows: {
    _key: string
    _type: 'tableRow'
    cells: string[]
  }[]
  markDefs: any
}

const components: Partial<PortableTextReactComponents> = {
  block: {
    h2: ({ children }) => {
      return <h2 className="text-4xl">{children}</h2>
    },
    h3: ({ children }) => {
      return <h3 className="text-3xl">{children}</h3>
    },
    h4: ({ children }) => {
      return <h4 className="text-2xl">{children}</h4>
    },
    h5: ({ children }) => {
      return <h5 className="text-xl">{children}</h5>
    },
    h6: ({ children }) => {
      return <h6 className="text-lg">{children}</h6>
    },
  },
  marks: {
    internalLink: ({ children, value }: PortableTextMarkComponentProps) => {
      return (
        <Link href={value?.href} prefetch={false} className="hover:text-muted-foreground underline">
          {children}
        </Link>
      )
    },
    link: ({ value, children }: PortableTextMarkComponentProps) => {
      return value?.blank ? (
        <a
          className="hover:text-muted-foreground underline"
          href={value?.href}
          rel="noreferrer noopener"
          target="_blank"
          aria-label={`Opens ${value?.href} in a new tab`}
          title={`Opens ${value?.href} in a new tab`}
        >
          {children}
        </a>
      ) : (
        <a className="hover:text-muted-foreground underline" href={value?.href}>
          {children}
        </a>
      )
    },
  },
  types: {
    twitter: ({ value }) => {
      return (
        <div className="not-prose flex items-center justify-center">
          <Tweet id={value.id} />
        </div>
      )
    },
    image: ({ value }) => {
      return (
        <figure className="my-2 flex flex-col items-center self-center rounded-lg shadow-md">
          <CustomImage image={value} width={720} height={379} className="rounded-lg" />
          {(value.attribution || value.credit) && (
            <figcaption className="text-muted-foreground flex items-center gap-2 text-sm">
              <CameraIcon className="h-4 w-4" />
              <span>Source: {value.credit ?? value.attribution}</span>
            </figcaption>
          )}
        </figure>
      )
    },
    table: ({ value }: { value: TableType }) => {
      const headerRow = value.rows[0]
      const rows = value.rows.slice(1)

      return (
        <div className="not-prose">
          <Table>
            <TableHeader>
              <TableRow>
                {headerRow &&
                  headerRow.cells.map((cell) => <TableHead key={cell}>{cell}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row._key}>
                  {row.cells.map((cell) => (
                    <TableCell key={cell}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )
    },
    youtubeEmbed: ({ value }) => {
      return <YouTubeEmbedComponent {...value} />
    },
  },
}

export function RichText<T>({ richText, className }: { richText?: T | null; className?: string }) {
  if (!richText) return null

  return (
    <div
      className={cn(
        'prose prose-zinc prose-a:underline-offset-2 dark:prose-invert md:prose-lg max-w-none',
        className,
      )}
    >
      <PortableText
        value={richText as PortableTextBlock[]}
        components={components}
        onMissingComponent={(_, { nodeType, type }) =>
          console.log('missing component', nodeType, type)
        }
      />
    </div>
  )
}
