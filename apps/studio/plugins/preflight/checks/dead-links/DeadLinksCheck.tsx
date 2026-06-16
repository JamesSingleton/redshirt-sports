import { Card, Stack, Text } from "@sanity/ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useClient } from "sanity";

import { SectionHeader } from "../../components/SectionHeader";
import { StatusRow } from "../../components/StatusRow";
import type { LinkFinding, PreflightCheckProps } from "../../types";
import { isVisitableLinkUrl, normalizeLinkUrl } from "../../utils/linkUrl";
import { checkLink, runWithConcurrency } from "./checkLink";
import { extractLinks } from "./extractLinks";
import { resolveLinkFindings } from "./resolveLinks";

type DeadLinksConfig = {
  contentField?: string;
};

function getLinksBadge(
  findings: LinkFinding[],
  hasChecked: boolean,
): string | undefined {
  if (findings.length === 0) {
    return undefined;
  }

  if (!hasChecked) {
    return `${findings.length} link${findings.length === 1 ? "" : "s"} found`;
  }

  const validCount = findings.filter(
    (finding) => finding.status === "success",
  ).length;

  return `${validCount}/${findings.length} links are valid`;
}

function DeadLinksCheckBase({
  document,
  contentField = "body",
}: PreflightCheckProps & DeadLinksConfig) {
  const client = useClient({ apiVersion: "2025-06-11" });
  const body = document?.displayed?.[contentField];
  const rawFindings = useMemo(() => extractLinks(body), [body]);
  const [findings, setFindings] = useState<LinkFinding[]>([]);
  const [hasChecked, setHasChecked] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolveLinks() {
      setIsResolving(true);
      setHasChecked(false);

      try {
        const resolved = await resolveLinkFindings(rawFindings, client);
        if (!cancelled) {
          setFindings(resolved);
        }
      } catch {
        if (!cancelled) {
          setFindings(
            rawFindings.map((finding) => ({
              id: finding.id,
              url: normalizeLinkUrl(finding.url),
              label: finding.label,
              source: finding.source,
              status: finding.incomplete ? "warning" : "initial",
              message: finding.incompleteMessage,
              incomplete: finding.incomplete,
              blockKey: finding.blockKey,
              markKey: finding.markKey,
              checkViaHttp: Boolean(finding.url),
            })),
          );
        }
      } finally {
        if (!cancelled) {
          setIsResolving(false);
        }
      }
    }

    void resolveLinks();

    return () => {
      cancelled = true;
    };
  }, [rawFindings, client]);

  const checkAllLinks = useCallback(async () => {
    setIsChecking(true);
    setHasChecked(true);

    const snapshot = [...findings];

    await runWithConcurrency(snapshot, async (finding) => {
      if (finding.incomplete || !finding.url) {
        return;
      }

      if (finding.status === "warning" && !finding.checkViaHttp) {
        return;
      }

      if (finding.status === "error") {
        return;
      }

      setFindings((current) =>
        current.map((item) =>
          item.id === finding.id
            ? { ...item, status: "checking", message: undefined }
            : item,
        ),
      );

      if (!finding.checkViaHttp) {
        setFindings((current) =>
          current.map((item) =>
            item.id === finding.id
              ? {
                  ...item,
                  status: finding.status === "warning" ? "warning" : "success",
                }
              : item,
          ),
        );
        return;
      }

      const result = await checkLink(finding.url);

      setFindings((current) =>
        current.map((item) => {
          if (item.id !== finding.id) {
            return item;
          }

          if (result.status === "success") {
            return {
              ...item,
              status: "success",
              message: undefined,
            };
          }

          return {
            ...item,
            status: "error",
            message: result.message ?? "Failed to fetch",
          };
        }),
      );
    });

    setIsChecking(false);
  }, [findings]);

  const badge = getLinksBadge(findings, hasChecked);

  return (
    <Stack space={4}>
      <SectionHeader
        action={{
          label: "Check all links",
          onClick: () => {
            void checkAllLinks();
          },
          disabled: isChecking || isResolving || findings.length === 0,
          loading: isChecking,
        }}
        badge={badge}
        description="Check the status of all links in the document, ensuring that they are reachable."
        title="Links"
      />

      {findings.length === 0 ? (
        <Card padding={4} radius={2} tone="transparent">
          <Text muted size={1}>
            No links found in this article&apos;s body.
          </Text>
        </Card>
      ) : (
        <Stack space={2}>
          {findings.map((finding) => {
            const visitUrl = isVisitableLinkUrl(finding.url)
              ? finding.url
              : undefined;

            return (
              <StatusRow
                key={finding.id}
                href={visitUrl}
                monospace={Boolean(finding.url)}
                primary={finding.url ?? finding.message ?? "Incomplete link"}
                secondary={
                  finding.url && finding.message ? finding.message : undefined
                }
                status={finding.status}
                strikethrough={
                  finding.status === "error" && Boolean(finding.url)
                }
                tertiary={finding.label}
              />
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}

export function DeadLinksCheck(
  config: DeadLinksConfig = {},
): typeof DeadLinksCheckBase {
  const Wrapped = (props: PreflightCheckProps) => (
    <DeadLinksCheckBase {...props} {...config} />
  );
  Wrapped.displayName = "DeadLinksCheck";
  return Wrapped;
}
