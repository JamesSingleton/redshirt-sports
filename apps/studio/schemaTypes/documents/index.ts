import { author } from './author'
import { conference } from './conference'
import { division } from './division'
import { footer } from './footer'
import { legal } from './legal'
import { membership } from './membership'
import { navbar } from './navbar'
import { post } from './post'
import { redirect } from './redirect'
import { school } from './school'
import { settings } from './settings'
import { sport } from './sport'
import { sportSubgrouping } from './sport-subgrouping'
import { tag } from './tag'

export const singletons = [footer, navbar, settings]

export const documents = [
  author,
  conference,
  division,
  legal,
  post,
  redirect,
  school,
  sport,
  sportSubgrouping,
  tag,
  membership,
  ...singletons,
]
