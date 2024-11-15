import { notFound } from 'next/navigation'
import PlayerTracker from './_components/PlayerTracker'

type Player = {
  id: string
  name: string
  photo: string
  class: string
  height: string
  weight: number
  highSchool: string
  location: string
  position: string
  previousTeam: {
    name: string
    logo: string
  }
  status: 'ENTERED' | 'COMMITTED' | 'WITHDRAWN'
  date: string
  division: string
  year: string
}

const mockPlayers: Player[] = [
  {
    id: '1',
    name: 'William Stewart',
    photo:
      'https://on3static.com/cdn-cgi/image/height=90,width=90/uploads/assets/403/214/214403.jpeg',
    class: 'SR',
    height: '5-11',
    weight: 210,
    highSchool: 'Lewisburg',
    location: 'Hernando, MS',
    position: 'LS',
    previousTeam: {
      name: 'Memphis',
      logo: 'https://on3static.com/uploads/assets/24/150/150024.svg',
    },
    status: 'ENTERED',
    date: '11/15/24',
    division: 'FBS',
    year: '2025',
  },
  {
    id: '2',
    name: 'David Cole',
    photo:
      'https://on3static.com/cdn-cgi/image/height=90,width=90/uploads/assets/711/381/381711.jpg',
    class: 'RS-FR',
    height: '6-4',
    weight: 193,
    highSchool: 'East Hamilton',
    location: 'Chattanooga, TN',
    position: 'WR',
    previousTeam: {
      name: 'Kennesaw State',
      logo: 'https://on3static.com/uploads/assets/982/149/149982.svg',
    },
    status: 'ENTERED',
    date: '11/02/24',
    division: 'FBS',
    year: '2024',
  },
]

export async function generateStaticParams() {
  const currentYear = new Date().getFullYear()

  return [
    { year: [] },
    { year: [currentYear.toString()] },
    { year: [(currentYear - 1).toString()] },
  ]
}

async function getYearData(year: string) {
  return { year, players: mockPlayers }
}

export default async function TransferPortalTrackerPage({
  params,
}: {
  params: { year?: string[] }
}) {
  const currentYear = new Date().getFullYear()
  const year = params.year?.[0] || currentYear.toString()

  if (parseInt(year) < 2020 || parseInt(year) > currentYear) {
    notFound()
  }

  const data = await getYearData(year)

  return <PlayerTracker year={year} data={data} />
}
