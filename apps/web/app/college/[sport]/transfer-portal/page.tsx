import { ChevronDown, ArrowRight } from 'lucide-react'

import { Button } from '@workspace/ui/components/button'

import { AthleteRow } from '@/components/transfer-portal/athlete-row'

interface Player {
  id: string
  name: string
  position: string
  height: string
  weight: string
  school: string
  location: string
  status: 'Withdrawn' | 'Committed' | 'Enrolled'
  lastTeam: string
  newTeam: string | null // Allow null for undecided players
  lastTeamLogo: string
  newTeamLogo: string | null // Allow null for undecided players
  photo: string
  classYear: string
}

const mockPlayers: Player[] = [
  {
    id: '1',
    name: 'Jayshon Platt',
    position: 'WR',
    height: '6-0',
    weight: '180',
    school: 'Venice (Venice, FL)',
    location: 'Venice, FL',
    status: 'Withdrawn',
    lastTeam: 'Florida Atlantic',
    newTeam: 'Florida Atlantic',
    lastTeamLogo: 'https://on3static.com/uploads/assets/934/149/149934.svg',
    newTeamLogo: 'https://on3static.com/uploads/assets/934/149/149934.svg',
    photo:
      'https://on3static.com/cdn-cgi/image/height=90,width=90,quality=95,fit=cover/uploads/assets/201/217/217201.png',
    classYear: 'JR',
  },
  {
    id: '2',
    name: 'Jack Shields',
    position: 'QB',
    height: '6-1',
    weight: '190',
    school: 'Centreville (Clifton, VA)',
    location: 'Clifton, VA',
    status: 'Committed',
    lastTeam: 'Virginia Tech',
    newTeam: null, // Example of undecided player
    lastTeamLogo: 'https://on3static.com/uploads/assets/765/214/214765.svg',
    newTeamLogo: null,
    photo:
      'https://on3static.com/cdn-cgi/image/height=90,width=90,quality=95,fit=cover/uploads/assets/471/494/494471.jpg',
    classYear: 'RS-JR',
  },
  {
    id: '3',
    name: 'Jeffrey Weimer',
    position: 'WR',
    height: '6-2',
    weight: '205',
    school: 'Salinas (San Francisco, CA)',
    location: 'San Francisco, CA',
    status: 'Enrolled',
    lastTeam: 'Idaho State',
    newTeam: 'West Virginia',
    lastTeamLogo:
      'https://dxbhsrqyrr690.cloudfront.net/sidearm.nextgen.sites/isubengals.com/images/responsive_2020/nav_main.svg',
    newTeamLogo: 'https://on3static.com/uploads/assets/789/149/149789.svg',
    photo:
      'https://on3static.com/cdn-cgi/image/height=90,width=90,quality=95,fit=cover/uploads/assets/259/493/493259.jpg',
    classYear: 'SR',
  },
  {
    id: '4',
    name: 'Shane Porter',
    position: 'RB',
    height: '5-10',
    weight: '186',
    school: 'Clear Brook (Friendswood, TX)',
    location: 'Friendswood, TX',
    status: 'Enrolled',
    lastTeam: 'North Texas',
    newTeam: 'Sam Houston',
    lastTeamLogo: 'https://on3static.com/uploads/assets/679/187/187679.svg',
    newTeamLogo: 'https://on3static.com/uploads/assets/787/309/309787.png',
    photo:
      'https://on3static.com/cdn-cgi/image/height=90,width=90,quality=95,fit=cover/uploads/assets/894/231/231894.png',
    classYear: 'RS-JR',
  },
  {
    id: '5',
    name: 'Andrew Yanoshak',
    position: 'TE',
    height: '6-2',
    weight: '235',
    school: 'Bishop Guilfoyle (Altoona, PA)',
    location: 'Altoona, PA',
    status: 'Enrolled',
    lastTeam: 'Notre Dame',
    newTeam: 'Dayton',
    lastTeamLogo: 'https://on3static.com/uploads/assets/123/150/150123.svg',
    newTeamLogo: 'https://on3static.com/uploads/assets/902/149/149902.svg',
    photo:
      'https://on3static.com/cdn-cgi/image/height=90,width=90,quality=95,fit=cover/uploads/assets/406/331/331406.png',
    classYear: 'SR',
  },
]

export default async function TransferPortal() {
  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">
          2025 College Football Transfer Portal
        </h2>
        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            2025 <ChevronDown className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            Football <ChevronDown className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            Status <ChevronDown className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
            Positions <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Statistics */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-gray-900">
                <ArrowRight className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm text-gray-600">ENTERED</span>
              <span className="text-2xl font-bold">4,173</span>
            </div>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-green-600">
                <span className="text-xs text-white">✓</span>
              </div>
              <span className="text-sm text-gray-600">COMMITTED</span>
              <span className="text-2xl font-bold">2,790</span>
              <span className="text-sm text-gray-500">67%</span>
            </div>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-red-600">
                <span className="text-xs text-white">↩</span>
              </div>
              <span className="text-sm text-gray-600">WITHDRAWN</span>
              <span className="text-2xl font-bold">147</span>
              <span className="text-sm text-gray-500">3.52%</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white">
          {/* Desktop Headers - hidden on mobile */}
          <div className="hidden border-b border-gray-200 px-4 py-3 md:block">
            <div
              className="grid items-center gap-4 text-sm font-medium text-gray-700"
              style={{
                gridTemplateColumns: '100px 110px 1.75fr 1fr 1fr 40px 1fr',
                gridTemplateAreas:
                  '"statusHeader avatarHeader playerHeader positionHeader lastTeamHeader arrowHeader newTeamHeader"',
              }}
            >
              <div style={{ gridArea: 'statusHeader' }}>Status</div>
              <div style={{ gridArea: 'avatarHeader' }}></div>
              <div style={{ gridArea: 'playerHeader' }}>Player</div>
              <div style={{ gridArea: 'positionHeader' }} className="text-center">
                Position
              </div>
              <div style={{ gridArea: 'lastTeamHeader' }} className="text-center">
                Last Team
              </div>
              <div style={{ gridArea: 'arrowHeader' }}></div>
              <div style={{ gridArea: 'newTeamHeader' }} className="text-center">
                New Team
              </div>
            </div>
          </div>

          <ul className="divide-y divide-gray-200 md:divide-y-0">
            {mockPlayers.map((player) => (
              <AthleteRow key={player.id} player={player} />
            ))}
          </ul>
        </div>

        {/* Update Notice */}
        <div className="mt-6 text-sm text-gray-500">UPDATE: 6/15/25</div>
      </div>
      <style jsx>{`
        .player-grid {
          grid-template-columns: var(--mobile-grid-columns);
          grid-template-areas: var(--mobile-grid-areas);
        }

        @media (min-width: 768px) {
          .player-grid {
            grid-template-columns: var(--desktop-grid-columns);
            grid-template-areas: var(--desktop-grid-areas);
          }
        }

        .player-status {
          grid-area: playerStatus;
        }

        .player-avatar {
          grid-area: avatar;
        }

        .player-position-mobile {
          grid-area: position;
        }

        .player-details {
          grid-area: details;
        }

        .player-position-desktop {
          grid-area: position;
        }

        .player-last-team {
          grid-area: lastTeam;
        }

        .player-arrow {
          grid-area: arrow;
        }

        .player-new-team {
          grid-area: newTeam;
        }

        .player-team-status {
          grid-area: teamStatus;
        }
      `}</style>
    </>
  )
}
