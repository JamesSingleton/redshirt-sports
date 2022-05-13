import { uriLooksSafe } from '@portabletext/to-html'
import htm from 'htm'
import vhtml from 'vhtml'

const html = htm.bind(vhtml)

const myPortableTextComponents = {
  types: {
    image: ({ value }) => html`<img src="${value.imageUrl}" />`,
    callToAction: ({ value, isInline }) =>
      isInline
        ? html`<a href="${value.url}">${value.text}</a>`
        : html`<div class="callToAction">${value.text}</div>`,
  },
  marks: {
    link: ({ children, value }) => {
      const href = value.href || ''
      if (uriLooksSafe(href)) {
        const rel = href.startsWith('/') ? undefined : 'noreferrer noopener'
        return html`<a href="${href}" rel="${rel}">${children}</a>`
      }

      return children
    },
  },
}

export default myPortableTextComponents
