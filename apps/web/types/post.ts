import type { Author, SanityImageAsset } from "@redshirt-sports/sanity/types";
import type { PortableTextBlock } from "next-sanity";

export type AuthorPosts = {
  posts: Post[];
  totalPosts: number;
};

export type Post = {
  _id: string;
  _updatedAt: string;
  publishedAt: string;
  slug: string;
  title: string;
  division: {
    _id: string;
    name: string;
    slug: string;
  };
  conferences: {
    _id: string;
    name: string;
    shortName: string;
    slug: string;
  }[];
  featuredArticle: boolean;
  excerpt: string;
  body: PortableTextBlock[];
  author: Author;
  authors: Author[];
  mainImage: SanityImageAsset;
  sport: string;
};
