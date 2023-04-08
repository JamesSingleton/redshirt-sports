import { fields } from "sanity-pills";

import { yearsList } from "../documents/player";

export default {
  name: "teamAssociation",
  title: "Team Association",
  type: "object",
  fields: fields({
    year: {
      options: {
        list: yearsList(0, 5),
      },
    },
    team: {
      type: "reference",
      to: [{ type: "school" }],
    },
  }),
};
