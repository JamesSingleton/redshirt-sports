import { FC } from 'react'

interface BadgeProps {
  children: any
}
const Badge: FC<BadgeProps> = ({ children }) => {
  return (
    <span className="transition-colors hover:text-red-200 duration-300 relative inline-flex px-2.5 py-1 rounded-full font-medium text-xs text-red-50 bg-red-800 hover:bg-red-600">
      {children}
    </span>
  )
}

export default Badge
