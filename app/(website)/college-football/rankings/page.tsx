import { Button } from '@/components/ui/button'
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

export default async function CollegeFootballRankingsPage() {
  const response = await fetch('http://localhost:3000/api/rankings')
  const rankings = await response.json()
  const top25 = []
  const outsideTop25 = []
  for (const team of rankings.rankedTeams) {
    if (team.rank <= 25) {
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
            <CardDescription className="flex items-center space-x-4">
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
                          {team._firstPlaceVotes ? (
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
            <CardTitle>NCAAF News</CardTitle>
          </CardHeader>
          <CardContent>
            {[
              {
                title: 'Boulder restaurant names burger after five-star Julian Lewis',
                description:
                  'Julian Lewis, the top recruit in the class of 2026, will have a burger named after him for his visit to the University of Colorado.',
                time: '18h',
                author: 'ESPN',
              },
              {
                title: 'Former Texas A&M star Darren Lewis dies at age 55 from cancer',
                description:
                  "Darren Lewis, the Texas A&M star who broke Eric Dickerson's Southwest Conference rushing record before addiction derailed his football career and post-football life, died Thursday night at age 55 from cancer.",
                time: '1d',
                author: 'Dave Wilson',
              },
              {
                title: 'Auburn flips 4-star RB Alvin Henderson from Penn State',
                description:
                  'Auburn gained a major in-state flip and its highest-rated prospect in the 2024 class when running back Alvin Henderson, No. 55 in the ESPN 300, decommitted from Penn State and gave his verbal pledge to the Tigers on Friday.',
                time: '1d',
                author: 'ESPN',
              },
            ].map((news, index) => (
              <div key={index} className="mb-4">
                <p className="font-bold">{news.title}</p>
                <p>{news.description}</p>
                <p className="text-sm text-gray-500">
                  {news.time} - {news.author}
                </p>
              </div>
            ))}
            <Button variant="link" className="mt-4">
              All NCAAF News
            </Button>
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
