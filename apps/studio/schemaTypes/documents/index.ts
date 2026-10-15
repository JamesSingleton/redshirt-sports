import { author } from "./author";
import { classification } from "./classification";
import { conference } from "./conference";
import { division } from "./division";
import {
  bracketPromo,
  category,
  homepage,
  jobPosting,
  page,
  person,
  podcastEpisode,
  podcastShow,
  pollRelease,
  video,
} from "./editorial";
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

export const singletons = [footer, navbar, settings, homepage];

export const documents = [
  author,
  person,
  category,
  page,
  podcastShow,
  podcastEpisode,
  video,
  pollRelease,
  bracketPromo,
  jobPosting,
  conference,
  division,
  classification,
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
