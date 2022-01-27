import { FC } from 'react'

interface BadgeProps {
  children: any
}
const Badge: FC<BadgeProps> = ({ children }) => {
  return (
    <span className="relative inline-flex rounded-full bg-red-800 px-2.5 py-1 text-xs font-medium text-red-50 transition-colors duration-300 hover:bg-red-600 hover:text-red-200">
      {children}
    </span>
  )
}

export default Badge
