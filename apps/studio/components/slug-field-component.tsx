import { CopyIcon, EditIcon, FolderIcon, WarningOutlineIcon } from '@sanity/icons'
import { Badge, Box, Button, Card, Flex, Stack, Text, TextInput } from '@sanity/ui'
import type { FocusEvent, FormEvent, MouseEvent } from 'react'
import { useCallback, useMemo, useRef, useState } from 'react'
import {
  type ObjectFieldProps,
  set,
  type SlugValue,
  unset,
  useFormValue,
  useValidationStatus,
} from 'sanity'
import slugify from 'slugify'
import { styled } from 'styled-components'

import { getDocumentPath, stringToPathname } from '../utils/helper'
import type { DocumentWithLocale } from '../utils/types'

const presentationOriginUrl = process.env.SANITY_STUDIO_PRESENTATION_URL

const UnlockButton = styled(Button)`
  cursor: pointer;
  > span:nth-of-type(2) {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
  }
`
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

const FolderText = styled(Text)`
  span {
    white-space: nowrap;
    overflow-x: hidden;
    text-overflow: ellipsis;
  }
`

export function PathnameFieldComponent(props: ObjectFieldProps<SlugValue>) {
  const document = useFormValue([]) as DocumentWithLocale
  const validation = useValidationStatus(document?._id.replace(/^drafts\./, ''), document?._type)

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
  const pathSegmentInputRef = useRef<HTMLInputElement>(null)

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

  const updateSegment = useCallback(
    (index: number, newValue: string) => {
      const newSegments = [...segments]
      newSegments[index] = slugify(newValue, {
        lower: true,
        remove: /[^a-zA-Z0-9 ]/g,
      })
      handleChange(newSegments.join('/'))
    },
    [segments, handleChange],
  )

  const updateFullPath = useCallback(
    (e: FormEvent<HTMLInputElement>) => {
      handleChange(e.currentTarget.value)
    },
    [handleChange],
  )

  const unlockFolder = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setFolderLocked(false)
    requestAnimationFrame(() => {
      fullPathInputRef.current?.focus()
    })
  }, [])

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
    if (folderLocked && segments.length > 1) {
      return (
        <Stack space={2}>
          <Flex gap={2}>
            {segments.slice(0, -1).map((segment, index) => (
              <Flex key={segment} gap={1} align="center">
                <Card
                  paddingX={2}
                  paddingY={2}
                  border
                  radius={1}
                  tone="transparent"
                  style={{
                    position: 'relative',
                  }}
                >
                  <Flex gap={2} align="center">
                    <Text muted>
                      <FolderIcon />
                    </Text>
                    <FolderText muted>{segment}</FolderText>
                  </Flex>
                </Card>
                <Text muted size={2}>
                  /
                </Text>
              </Flex>
            ))}
            <Flex gap={1} flex={1} align="center">
              <Box flex={1}>
                <TextInput
                  width="100%"
                  value={segments[segments.length - 1] || ''}
                  onChange={(e) => updateSegment(segments.length - 1, e.currentTarget.value)}
                  ref={pathSegmentInputRef}
                  onBlur={handleBlur}
                  disabled={readOnly}
                />
              </Box>
            </Flex>
            <UnlockButton
              icon={EditIcon}
              onClick={unlockFolder}
              title="Edit full path"
              mode="bleed"
              tone="primary"
              padding={2}
              fontSize={1}
              disabled={readOnly}
            >
              <span />
            </UnlockButton>
          </Flex>
        </Stack>
      )
    }

    return (
      <Stack space={2}>
        <Box>
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
  }, [
    folderLocked,
    segments,
    value,
    updateFullPath,
    handleBlur,
    readOnly,
    unlockFolder,
    updateSegment,
  ])

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

      {pathInput}
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
