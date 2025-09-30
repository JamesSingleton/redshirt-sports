import { toPlainText } from '@portabletext/react'
import { Stack, Text } from '@sanity/ui'
import type { PortableTextInputProps, StringInputProps } from 'sanity'

export function CharacterCountInput(props: StringInputProps) {
  // check if validations exist
  // @ts-ignore
  const validationRules = props.schemaType.validation[0]._rules || []

  //check if max Character validation exists and get the value
  const max = validationRules
    .filter((rule: any) => rule.flag === 'max')
    .map((rule: any) => rule.constraint)[0]
  return (
    <Stack space={3}>
      {props.renderDefault(props)}
      <Text muted size={1}>
        Characters: {props.value?.length || 0}
        {max ? ` / ${max}` : ''}
      </Text>
    </Stack>
  )
}

export function CharacterCountInputPTE(props: PortableTextInputProps) {
  // check if validations exist
  // @ts-ignore
  const validationRules = props.schemaType.validation[0]._rules || []
  const characters = props.value ? toPlainText(props.value).length : 0

  //check if max Character validation exists and get the value
  const max = validationRules
    .filter((rule: any) => rule.flag === 'max')
    .map((rule: any) => rule.constraint)[0]
  return (
    <Stack space={3}>
      {props.renderDefault(props)}
      <Text muted size={1}>
        Characters: {characters}
        {max ? ` / ${max}` : ''}
      </Text>
    </Stack>
  )
}
