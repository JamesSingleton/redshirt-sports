import { TrendingUp, User, ClipboardList, FlipHorizontal } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card'

export default function AdminPage() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recruited Players</CardTitle>
            <User className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">235</div>
            <p className="text-xs text-muted-foreground">+12 this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transfer Portal</CardTitle>
            <FlipHorizontal className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+120</div>
            <p className="text-xs text-muted-foreground">+5 since last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Player Offers</CardTitle>
            <ClipboardList className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+370</div>
            <p className="text-xs text-muted-foreground">+20 this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Player Rankings</CardTitle>

            <TrendingUp className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Top 500</div>
            <p className="text-xs text-muted-foreground">Updated daily</p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
