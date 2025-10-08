import { primaryDb as db } from '../client'

export async function getSchoolBySanityId(sanityId: string) {
  return db.query.schoolsTable.findFirst({
    where: (model, { eq }) => eq(model.sanityId, sanityId),
  })
}
