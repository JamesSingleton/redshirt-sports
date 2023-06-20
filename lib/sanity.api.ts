export const useCdn = process.env.NODE_ENV === 'production'

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET

export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2023-01-01'

export const previewSecretId: `${string}.${string}` = 'preview.secret'
