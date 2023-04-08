import 'server-only'

import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId, useCdn } from '@lib/sanity.api'
import { allAuthors, privacyPolicy, postsBySlugQuery } from '@lib/sanity.queries'
import { AboutPagePayload, PrivacyPolicyPagePayload, PostPayload } from '@types'

const sanityClient = (token?: string) => {
  return projectId ? createClient({ projectId, dataset, apiVersion, token, useCdn }) : null
}

export async function getAboutPageAuthors({
  token,
}: {
  token?: string
}): Promise<AboutPagePayload | undefined> {
  return await sanityClient(token)?.fetch(allAuthors)
}

export async function getPrivacyPolicyPage({
  token,
}: {
  token?: string
}): Promise<PrivacyPolicyPagePayload | undefined> {
  return await sanityClient(token)?.fetch(privacyPolicy)
}

export async function getPageBySlug({
  slug,
  token,
}: {
  slug: string
  token?: string
}): Promise<PostPayload | undefined> {
  return await sanityClient(token)?.fetch(postsBySlugQuery, { slug })
}
