import { useMemo } from 'react'
import { Box, Stack, Text } from '@sanity/ui'

import { type StringInputProps } from 'sanity'

export function TextInputWithLimits(props: StringInputProps) {
  const characterCount = useMemo(() => (props.value ? props.value.length : 0), [props.value])

  return (
    <Stack space={2}>
      <Box>{props.renderDefault(props)}</Box>
      <Text size={1}>Characters: {characterCount}</Text>
    </Stack>
  )
}
