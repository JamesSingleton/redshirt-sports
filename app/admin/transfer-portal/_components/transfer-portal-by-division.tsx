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
  fbs: {
    label: 'FBS',
    color: 'hsl(var(--chart-1))',
  },
  fcs: {
    label: 'FCS',
    color: 'hsl(var(--chart-2))',
  },
  dii: {
    label: 'DII',
    color: 'hsl(var(--chart-3))',
  },
  diii: {
    label: 'DIII',
    color: 'hsl(var(--chart-4))',
  },
  naia: {
    label: 'NAIA',
    color: 'hsl(var(--chart-5))',
  },
} satisfies ChartConfig

const chartData = [
  { division: 'fbs', players: 500, fill: 'var(--color-fbs)' },
  { division: 'fcs', players: 200, fill: 'var(--color-fcs)' },
  { division: 'dii', players: 300, fill: 'var(--color-dii)' },
  { division: 'diii', players: 400, fill: 'var(--color-diii)' },
  { division: 'naia', players: 300, fill: 'var(--color-naia)' },
]

export default function TransferPortalByDivision() {
  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-[4/3] [&_.recharts-text]:fill-background"
    >
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="players" hideLabel />} />
        <Pie data={chartData} dataKey="players">
          <LabelList
            dataKey="division"
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
