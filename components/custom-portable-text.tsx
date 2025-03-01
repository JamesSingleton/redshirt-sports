import Link from 'next/link'
import {
  PortableText,
  PortableTextComponents,
  PortableTextMarkComponentProps,
} from '@portabletext/react'
import { PortableTextBlock } from 'sanity'
import { CameraIcon } from 'lucide-react'

import { Image as SanityImage } from '@/components/image'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ReactTweet as Tweet } from '@/components/tweet'

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

const InternalLink = ({ children, value }: PortableTextMarkComponentProps) => {
  let linkHref = `/${value?.reference.slug}`

  if (value?.reference._type === 'division') {
    linkHref = `/news/${value?.reference.slug}`
  }

  if (value?.reference._type === 'conference') {
    linkHref = `/news/${value?.reference.divisionSlug}/${value?.reference.slug}`
  }

  return (
    <Link href={linkHref} prefetch={false} className="underline hover:text-muted-foreground">
      {children}
    </Link>
  )
}

export function CustomPortableText({
  paragraphClasses,
  value,
}: {
  paragraphClasses?: string
  value: PortableTextBlock[]
}) {
  const components: PortableTextComponents = {
    block: {
      normal: ({ children }) => {
        return <p className={paragraphClasses}>{children}</p>
      },
    },
    marks: {
      internalLink: InternalLink,
      link: ({ value, children }: PortableTextMarkComponentProps) => {
        return value?.blank ? (
          <a
            className="underline hover:text-muted-foreground"
            href={value?.href}
            rel="noreferrer noopener"
            target="_blank"
            aria-label={`Opens ${value?.href} in a new tab`}
            title={`Opens ${value?.href} in a new tab`}
          >
            {children}
          </a>
        ) : (
          <a className="underline hover:text-muted-foreground" href={value?.href}>
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
      image: ({ value }: { value: any }) => {
        return (
          <figure className="my-2 flex flex-col items-center self-center rounded-lg shadow-md">
            <SanityImage
              src={value}
              width={720}
              height={379}
              priority={false}
              className="rounded-lg"
              alt={value.asset.altText ?? value.caption}
            />
            {value.attribution && (
              <figcaption className="flex items-center gap-2 text-sm text-muted-foreground">
                <CameraIcon className="h-4 w-4" />
                <span>Source: {value.asset.creditLine ?? value.attribution}</span>
              </figcaption>
            )}
          </figure>
        )
      },
      top25Table: ({ value }) => {
        return (
          <div className="not-prose">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Voter</TableHead>
                  {Array.from(Array(25).keys()).map((num) => (
                    <TableHead key={num} className="w-8">
                      {num + 1}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {value.votes.map((vote: any) => {
                  return (
                    <TableRow key={vote._key}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="font-medium">{vote.voterName}</div>
                            <div className="mt-1 text-sm italic text-muted-foreground">
                              {vote.voterAffiliation}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      {vote.teams &&
                        vote.teams.map((team: any) => (
                          <TableCell key={team._id}>
                            <div className="w-8">
                              <SanityImage
                                className="w-full"
                                src={team.image}
                                width={32}
                                height={32}
                                alt={team.name}
                              />
                            </div>
                          </TableCell>
                        ))}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
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
                  {headerRow.cells.map((cell) => (
                    <TableHead key={cell}>{cell}</TableHead>
                  ))}
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
    },
  }

  return <PortableText components={components} value={value} />
}
