import { parseISO, format } from 'date-fns'
import { utcToZonedTime } from 'date-fns-tz'

import type { WithClassName } from '@types'

interface DateProps extends WithClassName {
  dateString: string
}

const timeZone = 'America/Phoenix'

export default function Date({ dateString, className }: DateProps) {
  const date = parseISO(dateString)

  return (
    <time dateTime={dateString} className={className} suppressHydrationWarning>
      {format(utcToZonedTime(date, timeZone), 'LLL d, yyyy')}
    </time>
  )
}
