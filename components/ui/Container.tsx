import React, { FC, ComponentType, HTMLAttributes } from 'react'
import cn from 'classnames'

interface ContainerProps {
  className?: string
  children?: any
  el?: HTMLElement
  clean?: boolean
}

const Container: FC<ContainerProps> = ({
  children,
  className,
  el = 'div',
  clean,
}) => {
  const rootClassName = cn(className, {
    'mx-auto py-12 px-4 max-w-7xl sm:px-6 lg:px-8 lg:py-24': !clean,
  })

  let Component: ComponentType<HTMLAttributes<HTMLDivElement>> = el as any

  return <Component className={rootClassName}>{children}</Component>
}

export default Container
