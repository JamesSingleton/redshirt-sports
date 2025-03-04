import { toPlainText } from '@portabletext/react'
import { Box, Stack, Text } from '@sanity/ui'
import { useMemo } from 'react'
import { PortableTextInputProps } from 'sanity'

export function BlockContentInput(props: PortableTextInputProps) {
  const characterCount = useMemo(
    () => (props.value ? toPlainText(props.value).length : 0),
    [props.value],
  )

  return (
    <Stack space={2}>
      <Box>{props.renderDefault(props)}</Box>
      <Text size={1}>Characters: {characterCount}</Text>
    </Stack>
  )
}
