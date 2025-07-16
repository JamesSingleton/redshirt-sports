import { at, defineMigration, set } from 'sanity/migrate'

const DIVISION_FCS_ID = ''
const DIVISION_1_ID = ''
const FCS_SUBGROUPING_ID = ''

export default defineMigration({
  title:
    'Update posts with FCS division to Division I and set sportSubgrouping to Football Championship Subdivision',
  documentTypes: ['post'],
  filter: `division._ref == "${DIVISION_FCS_ID}"`,
  migrate: {
    document(doc) {
      return [
        // Update division reference to Division I
        at('division', set({ _type: 'reference', _ref: DIVISION_1_ID })),
        // Set sportSubgrouping to Football Bowl Subdivision
        at('sportSubgrouping', set({ _type: 'reference', _ref: FCS_SUBGROUPING_ID })),
      ]
    },
  },
})
