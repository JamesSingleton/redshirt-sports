"use client";

import { Button } from "@redshirt-sports/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@redshirt-sports/ui/components/card";
import { useActionState } from "react";

import {
  fetchAndLoadAllSeasons,
  fetchAndLoadConferences,
  fetchAndLoadDivisions,
  fetchAndLoadSchools,
  fetchAndLoadSports,
  fetchAndLoadSubdivisions,
  fetchAndTransformRankings,
  type LoaderResult,
} from "@/actions/data-loaders";

type LoaderState = {
  success: boolean;
  message: string | null;
  error: string | null;
};

const initialLoaderState: LoaderState = {
  success: false,
  message: null,
  error: null,
};

interface LoaderActionProps {
  loader: () => Promise<LoaderResult>;
}

function LoaderAction({ loader }: LoaderActionProps) {
  const [state, runAction, isPending] = useActionState(
    async (
      _prevState: LoaderState,
      _formData: FormData,
    ): Promise<LoaderState> => {
      const result = await loader();
      if (!result.ok) {
        return { success: false, message: null, error: result.error };
      }
      return { success: true, message: result.message, error: null };
    },
    initialLoaderState,
  );

  return (
    <form action={runAction} className="w-full">
      <Button type="submit" disabled={isPending}>
        Run
      </Button>
      {isPending ? <span className="ml-2 text-sm">Loading...</span> : null}
      {state.error ? (
        <span className="text-destructive mt-2 block text-sm">
          {state.error}
        </span>
      ) : null}
      {state.success && state.message ? (
        <span className="mt-2 block text-sm text-green-600">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}

const configuredLoaders = [
  {
    label: "Sports",
    description:
      "This loader will pull sports from Sanity and load them. It should be the first loader run on a fresh db.",
    loader: fetchAndLoadSports,
  },
  {
    label: "Seasons, Season Types, and Weeks",
    description:
      "This loader will fetch season info along with season types and weeks for the three sports currently supported (football, mens basketball, and womens basketball) and insert it into the db. Season info going back to 2023 will be loaded.",
    loader: fetchAndLoadAllSeasons,
  },
  {
    label: "Divisions",
    description:
      "This loader will fetch and load division info (D1, D2, NAIA, etc). It should be run before conferences or subdivisions.",
    loader: fetchAndLoadDivisions,
  },
  {
    label: "Conferences",
    description:
      "This loader will fetch and load conference info (MVFC, UAC, etc). This should be run before schools in order for school conference affiliations to be created.",
    loader: fetchAndLoadConferences,
  },
  {
    label: "Subdivisions",
    description:
      "This loader will fetch subdivisions (FCS, FBS, etc) for the sports that support it. It should run before schools.",
    loader: fetchAndLoadSubdivisions,
  },
  {
    label: "Schools",
    description:
      "Fetch schools from Sanity and upsert them (safe to re-run). Also syncs conference affiliations.",
    loader: fetchAndLoadSchools,
  },
  {
    label: "Rankings",
    description:
      "Deprecated — use the poll-engine backfill script against a local prod clone.",
    loader: fetchAndTransformRankings,
  },
];

export default function Development() {
  return (
    <div className="p-8">
      <h2 className="mb-6 text-2xl font-bold">Data Loaders</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {configuredLoaders.map((loaderConfig) => (
          <Card key={loaderConfig.label}>
            <CardHeader>
              <CardTitle>{loaderConfig.label}</CardTitle>
              <CardDescription>{loaderConfig.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <LoaderAction loader={loaderConfig.loader} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
