'use client'

import { LabelList, Pie, PieChart } from 'recharts'

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

const chartConfig = {
  players: {
    label: 'Players',
  },
  qb: {
    label: 'QB',
    color: 'hsl(var(--chart-1))',
  },
  rb: {
    label: 'RB',
    color: 'hsl(var(--chart-2))',
  },
  wr: {
    label: 'WR',
    color: 'hsl(var(--chart-3))',
  },
  te: {
    label: 'TE',
    color: 'hsl(var(--chart-4))',
  },
  ol: {
    label: 'OL',
    color: 'hsl(var(--chart-5))',
  },
  dl: {
    label: 'DL',
    color: 'hsl(var(--chart-1))',
  },
  lb: {
    label: 'LB',
    color: 'hsl(var(--chart-2))',
  },
  db: {
    label: 'DB',
    color: 'hsl(var(--chart-3))',
  },
  ls: {
    label: 'LS',
    color: 'hsl(var(--chart-4))',
  },
  k: {
    label: 'K',
    color: 'hsl(var(--chart-5))',
  },
  p: {
    label: 'P',
    color: 'hsl(var(--chart-1))',
  },
  ath: {
    label: 'ATH',
    color: 'hsl(var(--chart-2))',
  },
}

const chartData = [
  { position: 'qb', players: 500, fill: 'var(--color-qb)' },
  { position: 'rb', players: 200, fill: 'var(--color-rb)' },
  { position: 'wr', players: 300, fill: 'var(--color-wr)' },
  { position: 'te', players: 400, fill: 'var(--color-te)' },
  { position: 'ol', players: 300, fill: 'var(--color-ol)' },
  { position: 'dl', players: 300, fill: 'var(--color-dl)' },
  { position: 'lb', players: 300, fill: 'var(--color-lb)' },
  { position: 'db', players: 300, fill: 'var(--color-db)' },
  { position: 'ls', players: 300, fill: 'var(--color-ls)' },
  { position: 'k', players: 300, fill: 'var(--color-k)' },
  { position: 'p', players: 300, fill: 'var(--color-p)' },
  { position: 'ath', players: 300, fill: 'var(--color-ath)' },
]

export default function TransferPortalByPosition() {
  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-[4/3] [&_.recharts-text]:fill-background"
    >
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="players" hideLabel />} />
        <Pie data={chartData} dataKey="players">
          <LabelList
            dataKey="position"
            className="fill-background"
            stroke="none"
            fontSize={12}
            formatter={(value: keyof typeof chartConfig) => chartConfig[value]?.label}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
