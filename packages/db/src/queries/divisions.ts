import { primaryDb as db } from '../client'

export async function getDivisionsBySportId(sportId: string) {
  return db.query.divisionSportsTable.findMany({
    where: (model, { eq }) => eq(model.sportId, sportId),
    with: {
      division: true,
    },
  })
}
