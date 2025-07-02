import { CopyIcon, WarningOutlineIcon } from '@sanity/icons'
import { Badge, Box, Button, Flex, Stack, Text, TextInput } from '@sanity/ui'
import type { FocusEvent, FormEvent } from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'
import {
  getPublishedId,
  type ObjectFieldProps,
  type SanityDocument,
  set,
  type SlugValue,
  unset,
  useFormValue,
  useValidationStatus,
} from 'sanity'
import slugify from 'slugify'
import { styled } from 'styled-components'

import { getDocumentPath, getPresentationUrl, stringToPathname } from '../utils/helper'

const presentationOriginUrl = getPresentationUrl()

const CopyButton = styled(Button)`
  margin-left: auto;
  cursor: pointer;
  > span:nth-of-type(2) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
  }
`

const GenerateButton = styled(Button)`
  margin-left: auto;
  cursor: pointer;
`

export function PathnameFieldComponent(props: ObjectFieldProps<SlugValue>) {
  const document = useFormValue([]) as SanityDocument
  const publishedId = getPublishedId(document?._id as string)
  const validation = useValidationStatus(publishedId, document?._type)

  const slugValidationError = useMemo(
    () =>
      validation.validation.find(
        (v) => (v?.path.includes('current') || v?.path.includes('slug')) && v.message,
      ),
    [validation.validation],
  )
  const {
    inputProps: { onChange, value, readOnly },
    title,
    description,
  } = props

  const segments = useMemo(() => value?.current?.split('/').filter(Boolean) || [], [value])
  const [folderLocked, setFolderLocked] = useState(segments.length > 1)

  const fullPathInputRef = useRef<HTMLInputElement>(null)

  const handleChange = useCallback(
    (value?: string) => {
      const finalValue = value ? stringToPathname(value, { allowTrailingSlash: true }) : undefined
      onChange(
        typeof value === 'string'
          ? set({
              current: finalValue,
              _type: 'slug',
            })
          : unset(),
      )
    },
    [onChange],
  )

  const handleGenerate = useCallback(() => {
    const title = document?.title as string | undefined
    if (title) {
      const newSegments = [...segments]
      if (newSegments.length > 1) {
        newSegments[newSegments.length - 1] = slugify(title, {
          lower: true,
          remove: /[^a-zA-Z0-9 ]/g,
        })
      } else {
        newSegments[0] = slugify(title, {
          lower: true,
          remove: /[^a-zA-Z0-9 ]/g,
        })
      }
      handleChange(newSegments.join('/'))
    }
  }, [document?.title, handleChange, segments])

  const updateFullPath = useCallback(
    (e: FormEvent<HTMLInputElement>) => {
      handleChange(e.currentTarget.value)
    },
    [handleChange],
  )

  const handleBlur = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      setFolderLocked(segments.length > 1)
    },
    [segments],
  )

  const localizedPathname = getDocumentPath({
    ...document,
    slug: value?.current,
  })

  const pathInput = useMemo(() => {
    return (
      <Stack space={2} style={{ flex: 1, width: '100%' }}>
        <Box width="100%">
          <TextInput
            value={value?.current || ''}
            onChange={updateFullPath}
            ref={fullPathInputRef}
            onBlur={handleBlur}
            disabled={readOnly}
            style={{ width: '100%' }}
          />
        </Box>
      </Stack>
    )
  }, [value, updateFullPath, handleBlur, readOnly])

  return (
    <Stack space={3}>
      <Stack space={2} flex={1}>
        <Text size={1} weight="semibold">
          {title}
        </Text>
        {description && <Text size={1}>{description}</Text>}
      </Stack>

      {typeof value?.current === 'string' && (
        <Flex direction="column" gap={2}>
          <Flex align="center">
            <p
              style={{
                textOverflow: 'ellipsis',
                margin: 0,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                color: 'var(--card-muted-fg-color)',
              }}
            >
              {`${presentationOriginUrl ?? ''}${localizedPathname}`}
            </p>
            <CopyButton
              icon={CopyIcon}
              onClick={() =>
                navigator.clipboard.writeText(`${presentationOriginUrl ?? ''}${localizedPathname}`)
              }
              title="Copy link"
              mode="bleed"
              tone="primary"
              fontSize={1}
            >
              <span />
            </CopyButton>
          </Flex>
        </Flex>
      )}

      <Flex gap={2}>
        {pathInput}
        <Stack>
          <GenerateButton
            text="Generate"
            aria-label="Generate URL slug from title"
            title="Generate URL slug from title"
            type="button"
            mode="default"
            tone="primary"
            fontSize={1}
            disabled={!document?.title}
            onClick={handleGenerate}
          />
        </Stack>
      </Flex>
      {slugValidationError ? (
        <Badge
          tone="critical"
          padding={4}
          style={{
            borderRadius: 'var(--card-radius)',
          }}
        >
          <Flex gap={4} align="center">
            <WarningOutlineIcon />
            <Text size={1} color="red">
              {slugValidationError.message}
            </Text>
          </Flex>
        </Badge>
      ) : null}
    </Stack>
  )
}
