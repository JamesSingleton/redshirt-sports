'use client'
import { ResponsivePie } from '@nivo/pie'
import { JSX, ClassAttributes, HTMLAttributes } from 'react'

export const ByDivisionChart = (
  props: JSX.IntrinsicAttributes & ClassAttributes<HTMLDivElement> & HTMLAttributes<HTMLDivElement>,
) => {
  return (
    <div {...props}>
      <ResponsivePie
        data={[
          { id: 'FBS', value: 111 },
          { id: 'FCS', value: 157 },
          { id: 'D2', value: 129 },
          { id: 'D3', value: 150 },
          { id: 'NAIA', value: 119 },
          { id: 'JUCO', value: 72 },
        ]}
        sortByValue
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        cornerRadius={0}
        padAngle={0}
        borderWidth={1}
        borderColor={'#ffffff'}
        enableArcLinkLabels={false}
        arcLabel={(d) => `${d.id}`}
        arcLabelsTextColor={'#ffffff'}
        arcLabelsRadiusOffset={0.65}
        colors={['#DC2727']}
        theme={{
          labels: {
            text: {
              fontSize: '18px',
            },
          },
          tooltip: {
            chip: {
              borderRadius: '9999px',
            },
            container: {
              fontSize: '16px',
              textTransform: 'capitalize',
              borderRadius: '6px',
              color: '#000000',
            },
          },
        }}
        role="application"
      />
    </div>
  )
}

export const ByPositionChart = (
  props: JSX.IntrinsicAttributes & ClassAttributes<HTMLDivElement> & HTMLAttributes<HTMLDivElement>,
) => {
  return (
    <div {...props}>
      <ResponsivePie
        data={[
          { id: 'QB', value: 111 },
          { id: 'RB', value: 157 },
          { id: 'WR', value: 129 },
          { id: 'TE', value: 150 },
          { id: 'OL', value: 119 },
          { id: 'DL', value: 72 },
          { id: 'LB', value: 72 },
          { id: 'DB', value: 72 },
          { id: 'ATH', value: 72 },
          { id: 'K', value: 72 },
          { id: 'P', value: 72 },
          { id: 'LS', value: 72 },
        ]}
        sortByValue
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        cornerRadius={0}
        padAngle={0}
        borderWidth={1}
        borderColor={'#ffffff'}
        enableArcLinkLabels={false}
        arcLabel={(d) => `${d.id}`}
        arcLabelsTextColor={'#ffffff'}
        arcLabelsRadiusOffset={0.65}
        colors={['#DC2727']}
        theme={{
          labels: {
            text: {
              fontSize: '18px',
            },
          },
          tooltip: {
            chip: {
              borderRadius: '9999px',
            },
            container: {
              fontSize: '16px',
              textTransform: 'capitalize',
              borderRadius: '6px',
              color: '#000000',
            },
          },
        }}
        role="application"
      />
    </div>
  )
}
