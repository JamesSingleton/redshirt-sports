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
import {
  generateSlugFromTitle,
  getSlugPreviewPath,
} from "@/utils/slug-validation";
import ButtonAssetCopy from "./button-asset-copy";

const presentationOriginUrl = process.env.SANITY_STUDIO_PRESENTATION_URL;

const monoStyle = { fontFamily: "monospace" } as const;

export function PathnameFieldComponent(props: ObjectFieldProps<SlugValue>) {
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

  const localizedPathname = getSlugPreviewPath(document?._type, currentSlug);
  const fullUrl = `${presentationOriginUrl ?? ""}${localizedPathname}`;

  const handleChange = useCallback(
    (newValue?: string) => {
      try {
        const patch =
          typeof newValue === "string"
            ? set({ current: newValue, _type: "slug" })
            : unset();
        onChange(patch);
      } catch {
        // Validation will show user-friendly messages
      }
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
    try {
      const documentTitle = (document?.title ?? document?.name) as
        | string
        | undefined;
      const documentType = document?._type;

      if (!(documentTitle?.trim() && documentType)) {
        return;
      }

      const generatedSlug = generateSlugFromTitle(documentTitle);

      if (generatedSlug) {
        handleChange(generatedSlug);
      }
    } catch {
      // Silently handle errors
    }
  }, [document?.title, document?.name, document?._type, handleChange]);

  const generateSource =
    (typeof document?.title === "string" && document.title.trim()) ||
    (typeof document?.name === "string" && document.name.trim());
  const generateDisabled = !generateSource || readOnly;

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
            URL Path
          </Text>
          <Flex align="center" gap={2}>
            <Box flex={1}>
              <TextInput
                disabled={readOnly}
                fontSize={1}
                onChange={handleSlugChange}
                placeholder="e.g., /spring-preview-vmi-rebuilds-entire-team"
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

        <Text muted size={1}>
          Use the generate button to create a slug based on the title.
        </Text>

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
