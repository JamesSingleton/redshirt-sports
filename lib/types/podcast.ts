export type Podcast = {
  title: string
  link: string
  pubDate: string
  enclosure: {
    url: string
    length: string
    type: string
  }
  content: string
  contentSnippet: string
  guid: string
  isoDate: string
  itunes: {
    summary: string
    explicit: string
    duration: string
    image: string
    episode: string
    season: string
  }
}
