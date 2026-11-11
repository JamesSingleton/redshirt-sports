import { advertisement } from "./advertisement";
import { author } from "./author";
import { breakingNews } from "./breaking-news";
import { classification } from "./classification";
import { collection } from "./collection";
import { conference } from "./conference";
import { footer } from "./footer";
import { governingBody } from "./governing-body";
import { legal } from "./legal";
import { navbar } from "./navbar";
import { post } from "./post";
import { redirect } from "./redirect";
import { school } from "./school";
import { settings } from "./settings";
import { sport } from "./sport";
import { sportSubgrouping } from "./sport-subgrouping";
import { tag } from "./tag";

export const singletons = [breakingNews, footer, navbar, settings];

export const documents = [
  advertisement,
  author,
  conference,
  classification,
  collection,
  governingBody,
  legal,
  post,
  redirect,
  school,
  sport,
  sportSubgrouping,
  tag,
  ...singletons,
];
