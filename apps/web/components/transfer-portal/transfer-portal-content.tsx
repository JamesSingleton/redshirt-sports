'use client'

import { useState } from 'react'
import { ChevronDown, ArrowRight, Lock } from 'lucide-react'
import { Button } from '@redshirt-sports/ui/components/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@redshirt-sports/ui/components/select'
import { Badge } from '@redshirt-sports/ui/components/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@redshirt-sports/ui/components/avatar'

// Mock data - replace with actual data fetching
const mockPlayers = [
  {
    id: 1,
    name: 'Amari Wallace',
    status: 'Committed',
    position: 'S',
    year: 'FR',
    height: '5-9.5',
    weight: '175',
    highSchool: 'Miami Central (Miami, FL)',
    rating: 87.0,
    ratingSecondary: 89.3,
    nilValue: 'TR',
    lastTeam: 'Miami',
    lastTeamLogo: '🔶',
    newTeam: 'Sacramento State',
    newTeamLogo: '🟢',
    image: null,
  },
  {
    id: 2,
    name: 'Horatio Fields',
    status: 'Committed',
    position: 'WR',
    year: 'RS-SR',
    height: '6-3',
    weight: '190',
    highSchool: 'New Manchester (Douglasville, GA)',
    rating: 89.25,
    ratingSecondary: 80.84,
    nilValue: 'TR',
    lastTeam: 'Auburn',
    lastTeamLogo: '🟠',
    newTeam: 'Ole Miss',
    newTeamLogo: '🔴',
    image: null,
  },
  {
    id: 3,
    name: 'Devin Hightower',
    status: 'Committed',
    position: 'LB',
    year: 'RS-SR',
    height: '6-1',
    weight: '225',
    highSchool: 'Archbishop Hoban (Akron, OH)',
    rating: 87.0,
    ratingSecondary: 86.83,
    nilValue: 'TR',
    lastTeam: 'Ohio State',
    lastTeamLogo: '🔴',
    newTeam: 'Tulsa',
    newTeamLogo: '🔵',
    image: null,
  },
  {
    id: 4,
    name: 'Marcus Calwise',
    status: 'Committed',
    position: 'WR',
    year: 'SO',
    height: '5-10',
    weight: '185',
    highSchool: 'Newton (Covington, GA)',
    rating: 85.0,
    ratingSecondary: null,
    nilValue: 'TR',
    lastTeam: 'Eastern Kentucky',
    lastTeamLogo: '⚪',
    newTeam: 'Louisiana Tech',
    newTeamLogo: '🔵',
    image: null,
  },
  {
    id: 5,
    name: 'Brandon Hayes',
    status: 'Committed',
    position: 'QB',
    year: 'JR',
    height: '6-2',
    weight: '205',
    highSchool: 'St. Thomas Aquinas (Fort Lauderdale, FL)',
    rating: 91.5,
    ratingSecondary: 88.9,
    nilValue: 'TR',
    lastTeam: 'Florida State',
    lastTeamLogo: '🍢',
    newTeam: 'Texas A&M',
    newTeamLogo: '🟤',
    image: null,
  },
  {
    id: 6,
    name: 'Trey Johnson',
    status: 'Committed',
    position: 'DL',
    year: 'RS-FR',
    height: '6-4',
    weight: '285',
    highSchool: 'IMG Academy (Bradenton, FL)',
    rating: 88.75,
    ratingSecondary: 91.2,
    nilValue: 'TR',
    lastTeam: 'Alabama',
    lastTeamLogo: '🔴',
    newTeam: 'Oregon',
    newTeamLogo: '🟢',
    image: null,
  },
  {
    id: 7,
    name: 'Jaylen Carter',
    status: 'Entered',
    position: 'CB',
    year: 'SO',
    height: '6-0',
    weight: '180',
    highSchool: 'Lakeland (Lakeland, FL)',
    rating: 86.5,
    ratingSecondary: 87.6,
    nilValue: 'TR',
    lastTeam: 'Georgia',
    lastTeamLogo: '🔴',
    newTeam: '',
    newTeamLogo: '',
    image: null,
  },
  {
    id: 8,
    name: 'Michael Rodriguez',
    status: 'Committed',
    position: 'TE',
    year: 'JR',
    height: '6-5',
    weight: '245',
    highSchool: 'De La Salle (Concord, CA)',
    rating: 87.25,
    ratingSecondary: 85.3,
    nilValue: 'TR',
    lastTeam: 'USC',
    lastTeamLogo: '🟡',
    newTeam: 'Michigan',
    newTeamLogo: '🔵',
    image: null,
  },
]

function StarRating({ rating }: { rating: number }) {
  const stars = Math.floor(rating / 20)
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className={`text-base ${i < stars ? 'text-[#FFB800]' : 'text-gray-300'}`}
        >
          ★
        </span>
      ))}
    </div>
  )
}

export function TransferPortalContent() {
  const [activeTab, setActiveTab] = useState('transfer-portal')
  const [selectedTeam, setSelectedTeam] = useState('all')
  const [selectedYear, setSelectedYear] = useState('2026')
  const [selectedSport, setSelectedSport] = useState('football')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPosition, setSelectedPosition] = useState('all')
  const [viewMode, setViewMode] = useState<'on3' | 'industry'>('on3')

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Main Content */}
      <div className="container py-10">
        {/* Page Title */}
        <h1 className="mb-10 text-5xl font-black tracking-tight text-gray-900">
          College Football Transfer Portal
        </h1>

        {/* Tabs */}
        <div className="mb-8 flex gap-0 border-b border-gray-200 bg-white">
          <button
            onClick={() => setActiveTab('top')}
            className={`border-b-2 px-8 py-3 text-sm font-semibold uppercase tracking-wide transition-colors ${
              activeTab === 'top'
                ? 'border-gray-400 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            TOP
          </button>
          <button
            onClick={() => setActiveTab('transfer-portal')}
            className={`border-b-2 px-8 py-3 text-sm font-semibold uppercase tracking-wide transition-colors ${
              activeTab === 'transfer-portal'
                ? 'border-[#FF4500] text-[#FF4500]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            TRANSFER PORTAL
          </button>
          <button
            onClick={() => setActiveTab('rankings')}
            className={`border-b-2 px-8 py-3 text-sm font-semibold uppercase tracking-wide transition-colors ${
              activeTab === 'rankings'
                ? 'border-gray-400 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            RANKINGS
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center justify-end gap-3">
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-[150px] border-gray-300 bg-white shadow-sm">
              <SelectValue placeholder="Team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              <SelectItem value="miami">Miami</SelectItem>
              <SelectItem value="auburn">Auburn</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[130px] border-gray-300 bg-white shadow-sm">
              <SelectValue placeholder="2026" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedSport} onValueChange={setSelectedSport}>
            <SelectTrigger className="w-[150px] border-gray-300 bg-white shadow-sm">
              <SelectValue placeholder="Football" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="football">Football</SelectItem>
              <SelectItem value="basketball">Basketball</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[150px] border-gray-300 bg-white shadow-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="committed">Committed</SelectItem>
              <SelectItem value="entered">Entered</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPosition} onValueChange={setSelectedPosition}>
            <SelectTrigger className="w-[150px] border-gray-300 bg-white shadow-sm">
              <SelectValue placeholder="Positions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Positions</SelectItem>
              <SelectItem value="qb">QB</SelectItem>
              <SelectItem value="wr">WR</SelectItem>
              <SelectItem value="rb">RB</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Summary */}
        <div className="mb-8 flex flex-wrap items-center gap-10 rounded-lg bg-white px-6 py-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <svg
                className="h-6 w-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600">ENTERED</span>
            </div>
            <span className="text-3xl font-bold text-gray-900">3,426</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <svg
                className="h-6 w-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600">COMMITTED</span>
            </div>
            <span className="text-3xl font-bold text-gray-900">2,348</span>
            <span className="text-base font-semibold text-gray-500">69%</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <svg
                className="h-6 w-6 text-[#FF4500]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF4500]">WITHDRAWN</span>
            </div>
            <span className="text-3xl font-bold text-gray-900">53</span>
            <span className="text-base font-semibold text-gray-500">1.55%</span>
          </div>

          <div className="ml-auto flex border-b border-gray-200">
            <button
              onClick={() => setViewMode('on3')}
              className={`border-b-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                viewMode === 'on3'
                  ? 'border-[#FF4500] text-[#FF4500]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              ON3 INDUSTRY
            </button>
            <button
              onClick={() => setViewMode('industry')}
              className={`border-b-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                viewMode === 'industry'
                  ? 'border-[#FF4500] text-[#FF4500]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              INDUSTRY COMPARISON
            </button>
          </div>
        </div>

        {/* Player Table */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 border-gray-200 bg-white">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                    Player
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                    Pos
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                    Rating
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                    NIL Value
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                    Last Team
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-700">
                    New Team
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mockPlayers.map((player) => (
                  <tr key={player.id} className="transition-colors hover:bg-gray-50/50">
                    <td className="px-6 py-5">
                      <span className="text-sm font-medium text-gray-700">{player.status}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20 rounded-lg">
                          <AvatarImage src={player.image || undefined} alt={player.name} />
                          <AvatarFallback className="rounded-lg bg-gray-100 text-base font-semibold text-gray-500">
                            {player.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="mb-1 cursor-pointer text-base font-bold text-[#FF4500] hover:underline">
                            {player.name}
                          </div>
                          <div className="text-sm font-medium text-gray-600">
                            {player.year} / {player.height} / {player.weight}
                          </div>
                          <div className="text-sm text-gray-500">{player.highSchool}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-semibold text-gray-900">{player.position}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <StarRating rating={player.rating} />
                          <span className="text-sm font-bold text-gray-900">
                            {player.rating.toFixed(2)}
                          </span>
                          <Badge
                            variant="secondary"
                            className="bg-[#FF4500] text-xs font-semibold text-white hover:bg-[#FF4500]"
                          >
                            {player.nilValue}
                          </Badge>
                        </div>
                        {player.ratingSecondary && (
                          <div className="flex items-center gap-2">
                            <StarRating rating={player.ratingSecondary} />
                            <span className="text-sm text-gray-600">{player.ratingSecondary.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <Lock className="h-5 w-5 text-emerald-500" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className="text-3xl">{player.lastTeamLogo}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {player.newTeamLogo ? (
                        <div className="flex items-center gap-3">
                          <ArrowRight className="h-5 w-5 text-gray-400" />
                          <span className="text-3xl">{player.newTeamLogo}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled
            className="border-gray-300 font-medium text-gray-400"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-[#FF4500] bg-[#FF4500] font-bold text-white hover:bg-[#FF4500]/90 hover:text-white"
          >
            1
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 font-medium text-gray-700 hover:border-[#FF4500] hover:text-[#FF4500]"
          >
            2
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 font-medium text-gray-700 hover:border-[#FF4500] hover:text-[#FF4500]"
          >
            3
          </Button>
          <span className="px-2 text-sm text-gray-500">...</span>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 font-medium text-gray-700 hover:border-[#FF4500] hover:text-[#FF4500]"
          >
            99
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 font-medium text-gray-700 hover:border-[#FF4500] hover:text-[#FF4500]"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
