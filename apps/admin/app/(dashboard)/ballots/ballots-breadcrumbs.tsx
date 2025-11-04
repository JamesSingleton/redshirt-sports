'use client'
import React from 'react'

function toPascalCase(segment: string): string {
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

import { useParams } from 'next/navigation'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@redshirt-sports/ui/components/breadcrumb'

function getBreadcrumbItems(params: Record<string, string | undefined>) {
  const items = [{ label: 'Ballots', href: '/ballots' }]
  if (params.sport) {
    items.push({ label: toPascalCase(params.sport), href: `/ballots/${params.sport}` })
  }
  if (params.division) {
    items.push({
      label: toPascalCase(params.division),
      href: `/ballots/${params.sport}/${params.division}`,
    })
  }
  if (params.season) {
    items.push({
      label: toPascalCase(params.season),
      href: `/ballots/${params.sport}/${params.division}/${params.season}`,
    })
  }
  if (params.week) {
    items.push({
      label: `Week ${params.week}`,
      href: `/ballots/${params.sport}/${params.division}/${params.season}/${params.week}`,
    })
  }
  return items
}

export default function BallotsBreadcrumbs() {
  const params = useParams() as Record<string, string | undefined>
  const items = getBreadcrumbItems(params)
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, idx) => (
          <React.Fragment key={item.href}>
            {idx > 0 && <BreadcrumbSeparator />}
            {idx === items.length - 1 ? (
              <BreadcrumbItem>
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              </BreadcrumbItem>
            ) : (
              <BreadcrumbItem>
                <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
              </BreadcrumbItem>
            )}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
