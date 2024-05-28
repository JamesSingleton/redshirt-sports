import { pgTable, serial, text, varchar, unique } from 'drizzle-orm/pg-core'

export const ballots = pgTable('ballots', {
  id: serial('id').primaryKey(),
  user_id: varchar('user_id', { length: 256 }),
  year: varchar('year', { length: 256 }),
  week: varchar('week', { length: 256 }),
  team_1: varchar('team_1', { length: 256 }),
  // team_2: varchar('team_2', { length: 256 }),
  // team_3: varchar('team_3', { length: 256 }),
  // team_4: varchar('team_4', { length: 256 }),
  // team_5: varchar('team_5', { length: 256 }),
  // team_6: varchar('team_6', { length: 256 }),
  // team_7: varchar('team_7', { length: 256 }),
  // team_8: varchar('team_8', { length: 256 }),
  // team_9: varchar('team_9', { length: 256 }),
  // team_10: varchar('team_10', { length: 256 }),
  // team_11: varchar('team_11', { length: 256 }),
  // team_12: varchar('team_12', { length: 256 }),
  // team_13: varchar('team_13', { length: 256 }),
  // team_14: varchar('team_14', { length: 256 }),
  // team_15: varchar('team_15', { length: 256 }),
  // team_16: varchar('team_16', { length: 256 }),
  // team_17: varchar('team_17', { length: 256 }),
  // team_18: varchar('team_18', { length: 256 }),
  // team_19: varchar('team_19', { length: 256 }),
  // team_20: varchar('team_20', { length: 256 }),
  // team_21: varchar('team_21', { length: 256 }),
  // team_22: varchar('team_22', { length: 256 }),
  // team_23: varchar('team_23', { length: 256 }),
  // team_24: varchar('team_24', { length: 256 }),
  // team_25: varchar('team_25', { length: 256 }),
})

export const rankings = pgTable('rankings', {
  id: serial('id').primaryKey(),
  year: varchar('year', { length: 256 }),
  week: varchar('week', { length: 256 }),
  team: varchar('team', { length: 256 }),
  votes: varchar('votes', { length: 256 }),
  rank: varchar('rank', { length: 256 }),
  user_id: varchar('user_id', { length: 256 }),
  ballot_id: varchar('ballot_id', { length: 256 }),
}, (t) => ({
  unq: unique().on(t.ballot_id)
}))