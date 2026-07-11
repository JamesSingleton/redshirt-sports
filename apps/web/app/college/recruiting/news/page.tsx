import { createStoryTypeArchivePage } from "@/lib/story-type-archive";

const { generateMetadata, default: RecruitingNewsPage } =
  createStoryTypeArchivePage({
    storyType: "recruiting",
    title: "Recruiting News",
    description:
      "College recruiting news, commitments, and analysis across sports.",
    canonicalPath: "/college/recruiting/news",
  });

export { generateMetadata };
export default RecruitingNewsPage;
