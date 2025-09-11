'use client'
import { useRouter, useParams } from 'next/navigation'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@redshirt-sports/ui/components/select'

type Week = {
  week: number
}

type Year = {
  year: number
}

export const RankingsFilters = ({ years, weeks }: { years: Year[]; weeks: Week[] }) => {
  const router = useRouter()
  const { division, year, week, sport } = useParams()

  const handleYearChange = (e: string) => {
    router.push(`/college/${sport}/rankings/${division}/${e}/0`)
  }

  const handleWeekChange = (e: string) => {
    router.push(`/college/${sport}/rankings/${division}/${year}/${e}`)
  }

  return (
    <>
      <Select onValueChange={handleYearChange} value={year as string}>
        <SelectTrigger id="year" aria-label="Year">
          <SelectValue placeholder={year} />
        </SelectTrigger>
        <SelectContent>
          {years.map(({ year }: Year) => (
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
          {weeks.map(({ week }: Week) => (
            <SelectItem
              key={week}
              value={week.toString() === '999' ? 'final-rankings' : week.toString()}
            >
              {/* {week === 0 ? 'Preseason' : `Week ${week}`} */}
              {/* if week === 0 then Preseason, if week is 999 Final Rankings else `Week ${week}` */}
              {week === 0 ? 'Preseason' : week === 999 ? 'Final Rankings' : `Week ${week}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )
}
