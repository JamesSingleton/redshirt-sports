import Studio from './Studio'

export const dynamic = 'force-static'

export { metadata } from 'next-sanity/studio'
export { viewport } from 'next-sanity/studio'

export default function StudioPage() {
  return <Studio />
}
