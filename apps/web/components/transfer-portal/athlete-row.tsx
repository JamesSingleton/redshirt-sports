import { CheckCircle, MoveRight } from 'lucide-react'
import { Badge } from '@workspace/ui/components/badge'

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

const UndecidedIcon = () => (
  <svg className="h-[50px] w-[50px]" viewBox="0 0 50 51" x="0" y="25%" height="12">
    <g>
      <path
        d="M49.9101 35.5812C49.9101 35.5812 52.9706 0.25 23.3855 0.25C23.3855 0.25 0 1.3541 0 25.5655C0 49.7768 24.5627 50.25 24.5627 50.25H38.2958C38.2958 50.25 44.0244 49.7768 44.0244 44.8872V35.5812C43.946 35.5812 50.1455 35.3446 49.9101 35.5812Z"
        fill="#E1E6EE"
      ></path>
      <path
        d="M13.027 14.4456H35.3138C36.8049 14.4456 38.0605 15.7074 38.0605 17.2058V42.3635L32.4888 36.7642H13.027C11.5359 36.7642 10.2803 35.5023 10.2803 34.0039V17.2847C10.2019 15.7074 11.4575 14.4456 13.027 14.4456Z"
        fill="#A1B1C8"
        fillOpacity="0.87"
      ></path>
      <path
        d="M28.565 21.9377C28.565 23.2784 27.9372 24.3825 26.6031 25.7232C25.5045 26.7484 25.1906 27.3005 25.1121 28.2468H23.2287C23.3072 27.0639 23.6996 26.3541 24.6413 25.25C25.8969 23.8304 26.2892 23.1207 26.2892 22.0954C26.2892 20.9125 25.583 20.1238 24.3274 20.1238C23.0718 20.1238 22.2085 20.9913 22.1301 22.5686H20.0112C20.0897 20.0449 21.8162 18.5465 24.4058 18.5465C27.074 18.4677 28.565 19.8872 28.565 21.9377ZM25.5045 30.6916C25.5045 31.4803 24.9552 32.0323 24.1704 32.0323C23.3857 32.0323 22.8363 31.4803 22.8363 30.6916C22.8363 29.903 23.3857 29.3509 24.1704 29.3509C24.9552 29.3509 25.5045 29.903 25.5045 30.6916Z"
        fill="white"
      ></path>
    </g>
  </svg>
)

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Withdrawn':
      return (
        <svg className="size-4" viewBox="0 0 22 18" fill="none">
          <path
            d="M6.91 12.59L5.5 14L0.5 9L5.5 4L6.91 5.41L4.33 8H17V10H4.33L6.91 12.59ZM19.5 0H10.5C9.39 0 8.5 0.9 8.5 2V6H10.5V2H19.5V16H10.5V12H8.5V16C8.5 17.1 9.39 18 10.5 18H19.5C20.6 18 21.5 17.1 21.5 16V2C21.5 0.9 20.6 0 19.5 0Z"
            fill="#E53935"
          />
        </svg>
      )
    // case "Committed":
    // return <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
    case 'Enrolled':
      return <CheckCircle className="size-4 text-green-500" />
    default:
      return <div></div>
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Withdrawn':
      return 'text-red-600'
    case 'Committed':
      return 'text-gray-700'
    case 'Enrolled':
      return 'text-gray-700'
    default:
      return 'text-gray-600'
  }
}

export const AthleteRow = ({ player }: { player: Player }) => {
  return (
    <li key={player.id} className="p-4 last:border-b-0 md:border-b md:border-gray-200">
      <div
        className="player-grid grid gap-2 md:items-center md:gap-4"
        style={{
          // Mobile grid
          '--mobile-grid-columns': '70px min-content 1fr min-content',
          '--mobile-grid-areas': `
            "avatar details details ."
            "position details details ."
            "playerStatus playerStatus teamStatus teamStatus"
          `,
          // Desktop grid
          '--desktop-grid-columns': '100px 110px 1.75fr 1fr 1fr 40px 1fr',
          '--desktop-grid-areas': '"playerStatus avatar details position lastTeam arrow newTeam"',
        }}
      >
        {/* Player Status */}
        <div className="player-status flex items-center gap-2">
          {getStatusIcon(player.status)}
          <span className={`text-sm font-medium ${getStatusColor(player.status)}`}>
            {player.status}
          </span>
        </div>

        {/* Avatar */}
        <div className="player-avatar">
          <img
            src={player.photo || '/placeholder.svg?height=90&width=90'}
            alt={player.name}
            className="h-16 w-16 rounded-lg object-cover md:h-20 md:w-20"
          />
        </div>

        {/* Position Badge - Mobile only */}
        <div className="player-position-mobile flex items-start pt-1 md:hidden">
          <Badge variant="secondary" className="text-xs font-medium">
            {player.position}
          </Badge>
        </div>

        {/* Details */}
        <div className="player-details min-w-0">
          <div className="mb-1">
            <span className="text-base font-semibold text-gray-900 md:text-lg">{player.name}</span>
          </div>
          <div className="mb-1 flex items-center gap-2 text-sm text-gray-600">
            <span>{player.classYear}</span>
            <span>/</span>
            <span>{player.height}</span>
            <span>/</span>
            <span>{player.weight}</span>
          </div>
          <div className="text-sm text-gray-600">
            <span>{player.school.split(' (')[0]}</span>
            <span className="ml-1">({player.school.split(' (')[1]}</span>
          </div>
        </div>

        {/* Position - Desktop only */}
        <div className="player-position-desktop hidden text-center md:block">
          <span className="text-sm font-medium text-gray-700">{player.position}</span>
        </div>

        {/* Last Team - Desktop only */}
        <div className="player-last-team hidden items-center justify-center md:flex">
          <img
            src={player.lastTeamLogo || '/placeholder.svg?height=50&width=50'}
            alt={player.lastTeam}
            className="h-[50px] w-[50px] object-contain"
          />
        </div>

        {/* Arrow - Desktop only */}
        <div className="player-arrow hidden items-center justify-center md:flex">
          <MoveRight className="font-mono text-lg text-gray-400" />
        </div>

        {/* New Team - Desktop only */}
        <div className="player-new-team hidden items-center justify-center md:flex">
          {player.newTeam ? (
            <img
              src={player.newTeamLogo || '/placeholder.svg?height=50&width=50'}
              alt={player.newTeam}
              className="h-[50px] w-[50px] object-contain"
            />
          ) : (
            <UndecidedIcon />
          )}
        </div>

        {/* Team Status - Mobile only */}
        <div className="player-team-status flex items-center justify-end gap-2 md:hidden">
          <img
            src={player.lastTeamLogo || '/placeholder.svg?height=24&width=24'}
            alt={player.lastTeam}
            className="h-6 w-6 object-contain"
          />
          <MoveRight className="h-4 w-4 text-gray-400" />
          {player.newTeam ? (
            <img
              src={player.newTeamLogo || '/placeholder.svg?height=24&width=24'}
              alt={player.newTeam}
              className="h-6 w-6 object-contain"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center">
              <svg className="h-6 w-6" viewBox="0 0 50 51" fill="none">
                <path
                  d="M49.9101 35.5812C49.9101 35.5812 52.9706 0.25 23.3855 0.25C23.3855 0.25 0 1.3541 0 25.5655C0 49.7768 24.5627 50.25 24.5627 50.25H38.2958C38.2958 50.25 44.0244 49.7768 44.0244 44.8872V35.5812C43.946 35.5812 50.1455 35.3446 49.9101 35.5812Z"
                  fill="#E1E6EE"
                ></path>
                <path
                  d="M13.027 14.4456H35.3138C36.8049 14.4456 38.0605 15.7074 38.0605 17.2058V42.3635L32.4888 36.7642H13.027C11.5359 36.7642 10.2803 35.5023 10.2803 34.0039V17.2847C10.2019 15.7074 11.4575 14.4456 13.027 14.4456Z"
                  fill="#A1B1C8"
                  fillOpacity="0.87"
                ></path>
                <path
                  d="M28.565 21.9377C28.565 23.2784 27.9372 24.3825 26.6031 25.7232C25.5045 26.7484 25.1906 27.3005 25.1121 28.2468H23.2287C23.3072 27.0639 23.6996 26.3541 24.6413 25.25C25.8969 23.8304 26.2892 23.1207 26.2892 22.0954C26.2892 20.9125 25.583 20.1238 24.3274 20.1238C23.0718 20.1238 22.2085 20.9913 22.1301 22.5686H20.0112C20.0897 20.0449 21.8162 18.5465 24.4058 18.5465C27.074 18.4677 28.565 19.8872 28.565 21.9377ZM25.5045 30.6916C25.5045 31.4803 24.9552 32.0323 24.1704 32.0323C23.3857 32.0323 22.8363 31.4803 22.8363 30.6916C22.8363 29.903 23.3857 29.3509 24.1704 29.3509C24.9552 29.3509 25.5045 29.903 25.5045 30.6916Z"
                  fill="white"
                ></path>
              </svg>
            </div>
          )}
        </div>
      </div>
    </li>
  )
}
