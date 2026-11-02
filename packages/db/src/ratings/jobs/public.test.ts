import { describe, expect, it, vi } from "vitest";

const failure = vi.hoisted(() => ({ error: null as unknown }));

// Every step of a query chain is a rejected promise that also has the next builder methods.
vi.mock("../../client", () => {
  const methods = [
    "select",
    "from",
    "innerJoin",
    "leftJoin",
    "where",
    "orderBy",
    "limit",
  ];
  const query = (): Promise<never> => {
    const promise = Promise.reject(failure.error);
    promise.catch(() => {});
    return Object.assign(
      promise,
      Object.fromEntries(methods.map((name) => [name, query])),
    );
  };
  return { primaryDb: { select: query, execute: query } };
});

import {
  getPublicPool,
  getPublishedRun,
  listPoolPredictions,
  listPublicPools,
  listPublishedWeeks,
} from "./public";

const missingTable = Object.assign(new Error("Failed query"), {
  cause: { code: "42P01", message: 'relation "rating_pools" does not exist' },
});

describe("public reads before the ratings migration", () => {
  it("read as nothing published when the tables don't exist yet", async () => {
    failure.error = missingTable;
    await expect(listPublicPools()).resolves.toEqual([]);
    await expect(getPublicPool("football", "fcs")).resolves.toBeNull();
    await expect(listPublishedWeeks("pool")).resolves.toEqual([]);
    await expect(getPublishedRun("run")).resolves.toBeNull();
    await expect(listPoolPredictions("pool")).resolves.toEqual([]);
  });

  it("still throw on any other database error", async () => {
    failure.error = Object.assign(new Error("connection refused"), {
      code: "ECONNREFUSED",
    });
    await expect(listPublicPools()).rejects.toThrow("connection refused");
    failure.error = Object.assign(new Error("missing"), { code: "42P01" });
    await expect(listPublishedWeeks("pool")).resolves.toEqual([]);
  });
});
