import author from './documents/author'
import category from './documents/category'
import post from './documents/post'
import legal from './documents/legal'
import player from './documents/player'
import school from './documents/school'
import { redirect } from './documents/redirect'
import transferPortal from './documents/transferPortal'
import conference from './documents/conference'
import division from './documents/division'

import mainImage from './objects/mainImage'
import blockContent from './objects/blockContent'
import position from './objects/playerPosition'
import height from './objects/height'
import twitter from './objects/twitter'
import socialMedia from './objects/socialMedia'
import classYear from './objects/classYear'

export const schemaTypes = [
  author,
  category,
  post,
  legal,
  player,
  school,
  redirect,
  transferPortal,
  conference,
  division,
  mainImage,
  blockContent,
  position,
  height,
  twitter,
  socialMedia,
  classYear,
]

export const PREVIEWABLE_DOCUMENT_TYPES: string[] = [
  post.name,
  author.name,
  category.name,
  legal.name,
  school.name,
  player.name,
]
