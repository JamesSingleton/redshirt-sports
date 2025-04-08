import React from 'react'

type PageHeaderProps = {
  title: string
  subtitle?: string | React.ReactNode
}

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <section className="py-12">
      <div className="container">
        <div className="md:max-w-3xl xl:max-w-5xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
            {title}
          </h1>
          {subtitle && <>{subtitle}</>}
        </div>
      </div>
    </section>
  )
}
