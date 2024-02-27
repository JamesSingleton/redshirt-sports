'use client'

import { useSearchParams, usePathname, useRouter } from 'next/navigation'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select'
import { Label } from '@components/ui/label'

const ConferencesWrittenFor = ({
  conferences,
}: {
  conferences: {
    _id: string
    name: string
    shortName: string
    division: string
  }[]
}) => {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const conferenceParam = searchParams.get('conference')
  const filteredConferences = conferences.filter((conference) => conference !== null)

  const conferencesByDivision = filteredConferences.reduce(
    (acc, conference) => {
      if (!acc[conference.division]) {
        acc[conference.division] = []
      }
      acc[conference.division].push(conference)
      return acc
    },
    {} as { [key: string]: typeof conferences },
  )

  const divisions = Object.keys(conferencesByDivision)

  const createPageUrl = (conference: string) => {
    const params = new URLSearchParams(searchParams ?? '')
    params.set('conference', conference)
    if (conference === 'all') {
      params.delete('conference')
    }
    return `${pathname}?${params}`
  }

  return (
    <div className="space-y-1">
      <Label>Filter Articles by Conference</Label>
      <Select
        onValueChange={(value) => router.push(createPageUrl(value))}
        defaultValue={conferenceParam ?? 'all'}
      >
        <SelectTrigger className="w-[280px]" aria-label="filter">
          <SelectValue placeholder="Select a conference" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Conferences</SelectItem>
          {divisions.map((division) => (
            <SelectGroup key={division}>
              <SelectLabel className="text-lg underline underline-offset-2">{division}</SelectLabel>
              {conferencesByDivision[division].map((conference) => (
                <SelectItem key={conference._id} value={conference.name}>
                  {conference.shortName ?? conference.name}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default ConferencesWrittenFor
