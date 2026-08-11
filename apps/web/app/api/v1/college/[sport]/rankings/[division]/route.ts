import {
  handleRankingsApiGet,
  rankingsApiOptions,
} from "@/lib/rankings-api-route";

export async function OPTIONS() {
  return rankingsApiOptions();
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sport: string; division: string }> },
) {
  const { sport, division } = await params;
  return handleRankingsApiGet(request, { sport, division });
}
