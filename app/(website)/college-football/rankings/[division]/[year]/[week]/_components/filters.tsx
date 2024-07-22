'use client'
import { useRouter, useParams } from 'next/navigation'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

export const RankingsFilters = ({ years, weeks }: { years: number[]; weeks: number[] }) => {
  const router = useRouter()
  const { division, year, week } = useParams()

  const handleYearChange = (e: string) => {
    router.push(`/college-football/rankings/${division}/${e}/0`)
  }

  const handleWeekChange = (e: string) => {
    router.push(`/college-football/rankings/${division}/${year}/${e}`)
  }

  return (
    <>
      <Select onValueChange={handleYearChange} value={year as string}>
        <SelectTrigger id="year" aria-label="Year">
          <SelectValue placeholder="2024" />
        </SelectTrigger>
        <SelectContent>
          {years.map((year: number) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select onValueChange={handleWeekChange} value={week as string}>
        <SelectTrigger id="ranking" aria-label="Ranking">
          <SelectValue placeholder="Preseason" />
        </SelectTrigger>
        <SelectContent>
          {weeks.map((week: number) => (
            <SelectItem key={week} value={week.toString()}>
              {week === 0 ? 'Preseason' : `Week ${week}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )
}
