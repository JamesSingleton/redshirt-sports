export default {
  title: "Player",
  name: "player",
  type: "object",
  fields: [
    {
      title: "Players Name",
      name: "playersName",
      type: "string",
      description: "Name of the player transferring",
    },
    {
      title: "Position",
      name: "position",
      description: "Position of the player transferring",
      type: "string",
      options: {
        list: [
          {
            title: "QB",
            value: "Quarterback",
          },
          {
            title: "RB",
            value: "Running Back",
          },
          {
            title: "WR",
            value: "Wide Receiver",
          },
          {
            title: "TE",
            value: "Tight End",
          },
          {
            title: "OL",
            value: "Offensive Line",
          },
          {
            title: "DL",
            value: "Defensive Line",
          },
          {
            title: "LB",
            value: "Linebacker",
          },
          {
            title: "DB",
            value: "Defensive Back",
          },
          {
            title: "LS",
            value: "Long Snapper",
          },
          {
            title: "K",
            value: "Kicker",
          },
          {
            title: "P",
            value: "Punter",
          },
        ],
      },
    },
    {
      title: "Transferred From",
      name: "transferredFrom",
      description: "School the player is transferring from",
      type: "string",
    },
    {
      title: "Transferred To",
      name: "transferredTo",
      description: "School the player is transferring to",
      type: "string",
    },
  ],
};
