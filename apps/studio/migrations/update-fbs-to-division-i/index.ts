import { at, defineMigration, set } from 'sanity/migrate'

const DIVISION_FBS_ID = ''
const DIVISION_1_ID = ''
const FBS_SUBGROUPING_ID = ''

export default defineMigration({
  title:
    'Update posts with FBS division to Division I and set sportSubgrouping to Football Bowl Subdivision',
  documentTypes: ['post'],
  filter: `division._ref == "${DIVISION_FBS_ID}"`,
  migrate: {
    document(doc) {
      return [
        // Update division reference to Division I
        at('division', set({ _type: 'reference', _ref: DIVISION_1_ID })),
        // Set sportSubgrouping to Football Bowl Subdivision
        at('sportSubgrouping', set({ _type: 'reference', _ref: FBS_SUBGROUPING_ID })),
      ]
    },
  },
})
