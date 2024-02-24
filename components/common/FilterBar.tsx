'use client'

import { X } from 'lucide-react'

import { Filter } from './Filter'

const positions = [
  {
    value: 'ATH',
    title: 'Athlete',
  },
  {
    value: 'QB',
    title: 'Quarterback',
  },
  {
    value: 'RB',
    title: 'Running Back',
  },
  {
    value: 'WR',
    title: 'Wide Receiver',
  },
  {
    value: 'TE',
    title: 'Tight End',
  },
  {
    value: 'OL',
    title: 'Offensive Line',
  },
  {
    value: 'DL',
    title: 'Defensive Line',
  },
  {
    value: 'LB',
    title: 'Linebacker',
  },
  {
    value: 'DB',
    title: 'Defensive Back',
  },
  {
    value: 'LS',
    title: 'Long Snapper',
  },
  {
    value: 'K',
    title: 'Kicker',
  },
  {
    value: 'P',
    title: 'Punter',
  },
]

export function FilterBar() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Filter title="Position" options={positions} />
        <Filter title="Status" />
      </div>
    </div>
  )
}
