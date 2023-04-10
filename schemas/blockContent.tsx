import { defineArrayMember, defineField } from 'sanity'

export default defineField({
  title: 'Block Content',
  name: 'blockContent',
  type: 'array',
  of: [
    {
      title: 'Block',
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'H1', value: 'h1' },
        { title: 'H2', value: 'h2' },
        { title: 'H3', value: 'h3' },
        { title: 'H4', value: 'h4' },
        { title: 'Quote', value: 'blockquote' },
      ],
      lists: [{ title: 'Bullet', value: 'bullet' }],
      // Marks let you mark up inline text in the block editor.
      marks: {
        // Decorators usually describe a single property – e.g. a typographic
        // preference or highlighting by editors.
        decorators: [
          { title: 'Strong', value: 'strong' },
          { title: 'Emphasis', value: 'em' },
        ],
        // Annotations can be any object structure – e.g. a link or a footnote.
        annotations: [
          {
            title: 'URL',
            name: 'link',
            type: 'object',
            fields: [
              {
                title: 'URL',
                name: 'href',
                type: 'url',
                description:
                  'Only use this if you are linking to a website outside of Redshirt Sports. If you are linking to a Redshirt Sports page, use the internal link option.',
                validation: (rule) =>
                  rule.uri({
                    scheme: ['http', 'https', 'mailto', 'tel'],
                  }),
              },
              {
                title: 'Open in new tab',
                name: 'blank',
                description: 'Read https://css-tricks.com/use-target_blank/',
                type: 'boolean',
                initialValue: true,
              },
            ],
          },
          {
            name: 'internalLink',
            title: 'Internal Link',
            type: 'object',
            icon: () => (
              <svg
                width="16px"
                viewBox="0 0 654 869"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                  <g id="sanity-logo-s-(1)" fill="currentColor" fillRule="nonzero">
                    <path
                      d="M343.36,744.64 C251.78,744.64 187.08,704.35 159.98,630.86 L0.46,630.86 C34.6,780.14 162,868.65 344.77,868.65 C453.44,868.65 546.21,830.93 600.45,764.96 C598.22,697.56 576,647.43 529,609.34 C513.78,693.66 445.35,744.64 343.36,744.64 Z"
                      id="Path"
                    ></path>
                    <path
                      d="M320.67,123.39 C429.86,123.39 473.76,185.33 491.09,228.56 L643.69,228.56 C608.91,83.5 491.64,0.76 319.25,0.76 C214.4,0.76 124.31,39.4 71,107 C73.64,167.86 97.19,215.7 143.35,252.26 C160.62,172.94 227.15,123.39 320.67,123.39 Z"
                      id="Path"
                    ></path>
                    <path
                      d="M436.38,381 L277.65,343.62 C234.863333,332.62 197.98,318.646667 167,301.7 C97.3,263.5 57.17,210 45.6,140 C45.17,140.87 44.76,141.76 44.34,142.63 C28.55,175.42 20.34,212.07 20.34,250.63 C20.34,371.11 89.02,445.51 230.34,478.08 L386.18,514 C432.4,526.19 471.41,540.84 503.74,558.49 C577.39,598.69 616.34,654.49 626.53,732.16 C626.9,731.44 627.25,730.71 627.61,729.99 C644.78,696.05 653.47,657.76 653.47,615.61 C653.49,463.53 535.43,404.08 436.38,381 Z"
                      id="Path"
                    ></path>
                  </g>
                </g>
              </svg>
            ),
            fields: [
              {
                title: 'Reference',
                name: 'reference',
                type: 'reference',
                to: [{ type: 'post' }, { type: 'category' }],
              },
            ],
          },
        ],
      },
    },
    // You can add additional types here. Note that you can't use
    // primitive types such as 'string' and 'number' in the same array
    // as a block type.
    {
      type: 'image',
      options: { hotspot: true, metaData: ['blurhash', 'lqip'] },
      fields: [
        {
          name: 'caption',
          type: 'string',
          title: 'Caption',
          description:
            'Just a brief description of the image as this will be used for alt text for accessibility.',
          validation: (rule) => rule.required(),
        },
        {
          name: 'attribution',
          type: 'string',
          title: 'Attribution',
          description: 'Where did the photo come from?',
          // validation: (Rule) => Rule.required(),
        },
      ],
    },
    {
      type: 'twitter',
    },
  ],
})
