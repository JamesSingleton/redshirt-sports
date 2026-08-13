import {
  handleRankingsApiGet,
  rankingsApiOptions,
} from "@/lib/rankings-api-route";

export async function OPTIONS() {
  return rankingsApiOptions();
}

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      sport: string;
      division: string;
      year: string;
      week: string;
    }>;
  },
) {
  const { sport, division, year, week } = await params;
  return handleRankingsApiGet(request, { sport, division, year, week });
}
