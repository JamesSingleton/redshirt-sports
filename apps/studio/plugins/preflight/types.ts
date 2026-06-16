import type { ComponentType } from "react";

export type CheckStatus =
  | "initial"
  | "checking"
  | "success"
  | "warning"
  | "error";

export type LinkSource =
  | "customLink"
  | "legacyLink"
  | "internalLink"
  | "youtube";

export type LinkFinding = {
  id: string;
  url?: string;
  label?: string;
  source: LinkSource;
  status: CheckStatus;
  message?: string;
  refId?: string;
  blockKey?: string;
  markKey?: string;
  incomplete?: boolean;
  checkViaHttp?: boolean;
};

export type EditorialRuleResult = {
  id: string;
  label: string;
  status: CheckStatus;
  message?: string;
  detail?: string;
};

export type PreflightCheckProps = {
  document?: {
    displayed: Record<string, unknown>;
  };
};

export type PreflightCheck = ComponentType<PreflightCheckProps>;

export type PreflightConfig = {
  checks: PreflightCheck[];
};

export type CustomUrlObject = {
  _type?: string;
  type?: "internal" | "external";
  external?: string;
  internalType?: "reference" | "custom" | "sportNews";
  internal?: { _ref?: string; _type?: string };
  internalUrl?: string;
  sportNewsLink?: {
    sport?: { _ref?: string };
    routeDepth?: string;
    segment?: { _ref?: string };
    conference?: { _ref?: string };
  };
};

export type RawLinkFinding = {
  id: string;
  url?: string;
  label?: string;
  source: LinkSource;
  incomplete?: boolean;
  incompleteMessage?: string;
  refId?: string;
  customUrl?: CustomUrlObject;
  blockKey?: string;
  markKey?: string;
};

export type RefDocument = {
  _id: string;
  _type: string;
  slug?: string;
  publishedAt?: string;
};
