import { Box, Button, Card, Flex, Stack, Text, TextInput } from "@sanity/ui";
import type { ChangeEvent } from "react";
import { useCallback, useMemo } from "react";
import {
  type ObjectFieldProps,
  type SanityDocument,
  type SlugValue,
  set,
  unset,
  useFormValue,
} from "sanity";

import { ValidationMessages } from "@/components/url-slug/validation-messages";
import { createSchoolSlugSource } from "@/utils/school-slug";
import { cleanSlug } from "@/utils/slug-validation";
import ButtonAssetCopy from "./button-asset-copy";

const presentationOriginUrl = process.env.SANITY_STUDIO_PRESENTATION_URL;
const monoStyle = { fontFamily: "monospace" } as const;

export function SchoolSlugFieldComponent(props: ObjectFieldProps<SlugValue>) {
  const {
    inputProps: { onChange, value, readOnly },
    title,
    description,
    validation,
  } = props;

  const document = useFormValue([]) as SanityDocument;
  const currentSlug = value?.current || "";

  const errors = useMemo(
    () => [
      ...new Set(
        validation
          .filter((v) => v.level === "error")
          .flatMap((v) => v.message.split("; ")),
      ),
    ],
    [validation],
  );
  const warnings = useMemo(
    () => [
      ...new Set(
        validation
          .filter((v) => v.level === "warning")
          .flatMap((v) => v.message.split("; ")),
      ),
    ],
    [validation],
  );

  const fullUrl = `${presentationOriginUrl ?? ""}/college/teams/${currentSlug}`;

  const handleChange = useCallback(
    (newValue?: string) => {
      const patch =
        typeof newValue === "string"
          ? set({ current: newValue, _type: "slug" })
          : unset();
      onChange(patch);
    },
    [onChange],
  );

  const handleSlugChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      handleChange(e.target.value);
    },
    [handleChange],
  );

  const handleGenerate = useCallback(() => {
    const source = createSchoolSlugSource(
      document as Record<string, unknown> | undefined,
    );
    if (!source) return;

    const generatedSlug = cleanSlug(
      source
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, ""),
    );

    if (generatedSlug) {
      handleChange(generatedSlug);
    }
  }, [document, handleChange]);

  const generateDisabled =
    !createSchoolSlugSource(document as Record<string, unknown> | undefined) ||
    readOnly;

  return (
    <Stack gap={4}>
      {(title || description) && (
        <Stack gap={2}>
          {title && (
            <Text size={1} weight="semibold">
              {title}
            </Text>
          )}
          {description && (
            <Text muted size={1}>
              {description}
            </Text>
          )}
        </Stack>
      )}

      <Stack gap={4}>
        <Stack gap={2}>
          <Text size={1} weight="medium">
            Team URL slug
          </Text>
          <Flex align="center" gap={2}>
            <Box flex={1}>
              <TextInput
                disabled={readOnly}
                fontSize={1}
                onChange={handleSlugChange}
                placeholder="e.g., army-black-knights"
                style={monoStyle}
                value={currentSlug}
              />
            </Box>
            <Button
              disabled={generateDisabled}
              fontSize={1}
              mode="ghost"
              onClick={handleGenerate}
              text="Generate"
              tone="primary"
            />
          </Flex>
        </Stack>

        <ValidationMessages errors={errors} warnings={warnings} />

        {currentSlug && errors.length === 0 && (
          <Stack gap={2}>
            <Text size={1} weight="medium">
              Preview
            </Text>
            <Flex align="center" gap={2}>
              <Card border flex={1} padding={3} radius={2} tone="transparent">
                <Text muted size={1} style={monoStyle}>
                  {fullUrl}
                </Text>
              </Card>
              <ButtonAssetCopy disabled={!currentSlug} url={fullUrl} />
            </Flex>
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
