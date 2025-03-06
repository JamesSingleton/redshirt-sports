import { CameraIcon } from "lucide-react"
import { PortableText, type PortableTextReactComponents, type PortableTextBlock } from "next-sanity"
import { cn } from "@workspace/ui/lib/utils"
import {Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,} from '@workspace/ui/components/table'

import { ReactTweet as Tweet } from '@/components/tweet'
import { Image as SanityImage } from '@/components/image'

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
  types: {
    twitter: ({value}) => {
      return (
        <div className="not-prose flex items-center justify-center">
          <Tweet id={value.id} />
        </div>
      )
    },
    image: ({value}) => {
      return (
        <figure className="my-2 flex flex-col items-center self-center rounded-lg shadow-md">
          <SanityImage
            asset={value}
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
                              asset={team.image}
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
                {headerRow && headerRow.cells.map((cell) => (
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
  }
}

export function RichText({
  richText,
  className,
}: {
  richText: PortableTextBlock[]
  className?: string
}) {
  return (
    <div className={cn(
      "prose prose-slate prose-headings:scroll-m-24 prose-headings:font-bold prose-headings:text-opacity-90 prose-p:text-opacity-80 prose-a:underline prose-ol:text-opacity-80 prose-ul:text-opacity-80 prose-h2:border-b prose-h2:pb-2 prose-h2:text-3xl prose-h2:font-semibold prose-h2:prose-h2:first:mt-0 max-w-none dark:prose-invert",
      className,
    )}>
      <PortableText
        value={richText}
        components={components}
        onMissingComponent={(_, { nodeType, type }) =>
          console.log("missing component", nodeType, type)
        }
      />
    </div>
  )
}