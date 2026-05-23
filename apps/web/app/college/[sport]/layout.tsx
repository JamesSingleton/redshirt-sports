import { client } from "@redshirt-sports/sanity/client";
import { sportInfoQuery } from "@redshirt-sports/sanity/queries";

// Pre-build every sport segment so nested routes (news, rankings) receive
// params.sport in their own generateStaticParams.
export async function generateStaticParams() {
  const sports = await client.withConfig({ useCdn: false }).fetch(sportInfoQuery);

  return (sports ?? []).map((sport: { slug: string }) => ({
    sport: sport.slug,
  }));
}

export default function SportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
