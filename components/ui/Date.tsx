import { parseISO, format } from 'date-fns'

import type { WithClassName } from '@types'

interface DateProps extends WithClassName {
  dateString: string
}

export default function Date({ dateString, className }: DateProps) {
  const date = parseISO(dateString)

  return (
    <time dateTime={dateString} className={className} suppressHydrationWarning>
      {format(date, 'LLL d, yyyy')}
    </time>
  )
}
