import Link from 'next/link'
import { formatDistance } from 'date-fns'

import { buttonVariants } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import { ImageComponent } from '@/components/common'
import { getLastThreePosts } from '@/lib/sanity.fetch'
import { getFinalRankingsForWeekAndYear } from '@/server/queries'

export default async function CollegeFootballRankingsPage({
  params,
}: {
  params: { division: string; year: string; week: string }
}) {
  const { division, year, week } = params
  const lastThreePosts = await getLastThreePosts(division)
  const finalRankings = await getFinalRankingsForWeekAndYear({
    year: parseInt(year, 10),
    week: parseInt(week, 10),
  })
  const { rankings } = finalRankings

  const top25 = []
  const outsideTop25 = []
  for (const team of rankings) {
    if (team.rank && team.rank <= 25) {
      top25.push(team)
    } else {
      outsideTop25.push(team)
    }
  }

  return (
    <div className="container mx-auto flex flex-col space-x-0 py-8 md:flex-row md:space-x-8">
      <div className="flex-1">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>FCS College Football Rankings</CardTitle>
            <CardDescription className="flex items-center space-x-4 pt-4">
              <Select>
                <SelectTrigger id="year" aria-label="Year">
                  <SelectValue placeholder="2024" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger id="ranking" aria-label="Ranking">
                  <SelectValue placeholder="Preseason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="final">Preseason</SelectItem>
                </SelectContent>
              </Select>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RK</TableHead>
                  <TableHead>TEAM</TableHead>
                  <TableHead>PTS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top25.map((team, index) => {
                  return (
                    <TableRow key={index}>
                      <TableCell>{team.isTie ? `T-${team.rank}` : team.rank}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <ImageComponent
                            image={team.image}
                            width={32}
                            height={32}
                            mode="contain"
                            className="mr-2 h-8 w-8"
                          />
                          {team.shortName ?? team.abbreviation ?? team.name}
                          {team.firstPlaceVotes ? (
                            <span className="ml-2 tracking-wider text-muted-foreground">
                              ({team.firstPlaceVotes})
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>{team._points}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <div className="mt-4">
              <p>
                <strong>Others receiving votes:</strong>{' '}
                {outsideTop25.map((team) => `${team.shortName} ${team._points}`).join(', ')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <aside className="mt-8 w-full md:mt-0 md:w-1/4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Latest NCAAF News</CardTitle>
          </CardHeader>
          <CardContent>
            {lastThreePosts.map((post) => (
              <Link href={`/${post.slug}`} key={post._id} className="group mb-4 block">
                <h4 className="font-bold group-hover:underline">{post.title}</h4>
                <p>{post.excerpt}</p>
                <p className="text-sm text-gray-500">
                  {formatDistance(post.publishedAt, new Date(), { addSuffix: true })} -{' '}
                  {post.author.name}
                </p>
              </Link>
            ))}
            <Link href="/news" className={buttonVariants({ variant: 'link' })}>
              All NCAAF News
            </Link>
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
