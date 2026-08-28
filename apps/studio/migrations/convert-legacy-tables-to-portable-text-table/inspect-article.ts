import "../load-env.js";
import { createClient } from "@sanity/client";

const slug =
  process.argv[2] ??
  "how-notre-dame-miami-benefits-the-black-college-football-hall-of-fame-classic";

const client = createClient({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
  dataset: process.env.SANITY_STUDIO_DATASET!,
  apiVersion: "2025-02-06",
  useCdn: false,
});

async function main() {
  const doc = await client.fetch(
    /* groq */ `
    *[_type == "post" && slug.current == $slug][0]{
      _id,
      title,
      "blockTypes": body[]{ _type },
      "tables": body[_type == "table"]{
        _key,
        headerRows,
        "rowTypes": rows[]{ _type },
        rows[]{
          _type,
          _key,
          cells[]{
            _type,
            _key,
            value[]{ _type, children[]{ text } }
          }
        }
      }
    }
  `,
    { slug },
  );

  console.log(JSON.stringify(doc, null, 2));
}

main().catch(console.error);
