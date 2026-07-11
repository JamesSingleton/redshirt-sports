import { createStoryTypeArchivePage } from "@/lib/story-type-archive";

const { generateMetadata, default: TransferPortalNewsPage } =
  createStoryTypeArchivePage({
    storyType: "transfer",
    title: "Transfer Portal News",
    description:
      "Breaking transfer portal news, commitments, and analysis across college sports.",
    canonicalPath: "/college/transfer-portal/news",
  });

export { generateMetadata };
export default TransferPortalNewsPage;
