import { FC, useState, useEffect } from 'react'
import { Popover } from '@headlessui/react'
import throttle from 'lodash.throttle'
import cn from 'classnames'
import styles from './Navbar.module.css'

const NavbarRoot: FC = ({ children }) => {
  const [hasScrolled, setHasScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = throttle(() => {
      const offset = 0
      const { scrollTop } = document.documentElement
      const scrolled = scrollTop > offset

      if (hasScrolled !== scrolled) {
        setHasScrolled(scrolled)
      }
    }, 200)

    document.addEventListener('scroll', handleScroll)

    return () => {
      document.removeEventListener('scroll', handleScroll)
    }
  }, [hasScrolled])

  return (
    <Popover
      as="header"
      className={cn(styles.root, { 'shadow-magical': hasScrolled })}
    >
      {children}
    </Popover>
  )
}

export default NavbarRoot
