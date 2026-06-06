import { client } from "@redshirt-sports/sanity/client";
import { queryGlobalSeoSettings } from "@redshirt-sports/sanity/queries";

export async function fetchGlobalSeoSettings() {
  return client.fetch(
    queryGlobalSeoSettings,
    {},
    { next: { revalidate: 604800 } },
  );
}
