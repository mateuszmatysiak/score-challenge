import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function seed() {
  await db.user.create({
    data: {
      username: "test",
      passwordHash:
        "$2y$10$aOufTP3luUvQikj/1UHQHOwc5qHWfrL3VU5EZjUVdA/HyST5D.lbC",
    },
  });

  await Promise.all(
    getTeams().map((team) => {
      return db.team.create({ data: team });
    })
  );

  await Promise.all(
    getGroups().map((group) => {
      return db.group.create({ data: group });
    })
  );
}

seed();

function getTeams() {
  return [
    { id: "qatar", name: "Qatar" },
    { id: "ecuador", name: "Ecuador" },
    { id: "netherlands", name: "Netherlands" },
    { id: "senegal", name: "Senegal" },

    { id: "england", name: "England" },
    { id: "iran", name: "Iran" },
    { id: "usa", name: "USA" },
    { id: "wales", name: "Wales" },

    { id: "argentina", name: "Argentina" },
    { id: "saudi-arabia", name: "Saudi Arabia" },
    { id: "mexico", name: "Mexico" },
    { id: "poland", name: "Poland" },

    { id: "france", name: "France" },
    { id: "australia", name: "Australia" },
    { id: "denmark", name: "Denmark" },
    { id: "tunisia", name: "Tunisia" },

    { id: "spain", name: "Spain" },
    { id: "costa-rica", name: "Costa Rica" },
    { id: "germany", name: "Germany" },
    { id: "japan", name: "Japan" },
  ];
}

function getGroups() {
  return [
    {
      id: "group-a",
      name: "A",
      matches: {
        create: [
          {
            teamHome: { connect: { id: "qatar" } },
            teamAway: { connect: { id: "ecuador" } },
          },
          {
            teamHome: { connect: { id: "senegal" } },
            teamAway: { connect: { id: "netherlands" } },
          },
          {
            teamHome: { connect: { id: "qatar" } },
            teamAway: { connect: { id: "senegal" } },
          },
          {
            teamHome: { connect: { id: "netherlands" } },
            teamAway: { connect: { id: "ecuador" } },
          },
          {
            teamHome: { connect: { id: "netherlands" } },
            teamAway: { connect: { id: "qatar" } },
          },
          {
            teamHome: { connect: { id: "ecuador" } },
            teamAway: { connect: { id: "senegal" } },
          },
        ],
      },
    },
    {
      id: "group-b",
      name: "B",
      matches: {
        create: [
          {
            teamHome: { connect: { id: "england" } },
            teamAway: { connect: { id: "iran" } },
          },
          {
            teamHome: { connect: { id: "usa" } },
            teamAway: { connect: { id: "wales" } },
          },
          {
            teamHome: { connect: { id: "wales" } },
            teamAway: { connect: { id: "iran" } },
          },
          {
            teamHome: { connect: { id: "england" } },
            teamAway: { connect: { id: "usa" } },
          },
          {
            teamHome: { connect: { id: "wales" } },
            teamAway: { connect: { id: "england" } },
          },
          {
            teamHome: { connect: { id: "iran" } },
            teamAway: { connect: { id: "usa" } },
          },
        ],
      },
    },
    {
      id: "group-c",
      name: "C",
      matches: {
        create: [
          {
            teamHome: { connect: { id: "argentina" } },
            teamAway: { connect: { id: "saudi-arabia" } },
          },
          {
            teamHome: { connect: { id: "mexico" } },
            teamAway: { connect: { id: "poland" } },
          },
          {
            teamHome: { connect: { id: "poland" } },
            teamAway: { connect: { id: "saudi-arabia" } },
          },
          {
            teamHome: { connect: { id: "argentina" } },
            teamAway: { connect: { id: "mexico" } },
          },
          {
            teamHome: { connect: { id: "poland" } },
            teamAway: { connect: { id: "argentina" } },
          },
          {
            teamHome: { connect: { id: "saudi-arabia" } },
            teamAway: { connect: { id: "mexico" } },
          },
        ],
      },
    },
    {
      id: "group-d",
      name: "D",
      matches: {
        create: [
          {
            teamHome: { connect: { id: "denmark" } },
            teamAway: { connect: { id: "tunisia" } },
          },
          {
            teamHome: { connect: { id: "france" } },
            teamAway: { connect: { id: "australia" } },
          },
          {
            teamHome: { connect: { id: "tunisia" } },
            teamAway: { connect: { id: "australia" } },
          },
          {
            teamHome: { connect: { id: "france" } },
            teamAway: { connect: { id: "denmark" } },
          },
          {
            teamHome: { connect: { id: "australia" } },
            teamAway: { connect: { id: "denmark" } },
          },
          {
            teamHome: { connect: { id: "tunisia" } },
            teamAway: { connect: { id: "france" } },
          },
        ],
      },
    },
    {
      id: "group-e",
      name: "E",
      matches: {
        create: [
          {
            teamHome: { connect: { id: "germany" } },
            teamAway: { connect: { id: "japan" } },
          },
          {
            teamHome: { connect: { id: "spain" } },
            teamAway: { connect: { id: "costa-rica" } },
          },
          {
            teamHome: { connect: { id: "japan" } },
            teamAway: { connect: { id: "costa-rica" } },
          },
          {
            teamHome: { connect: { id: "spain" } },
            teamAway: { connect: { id: "germany" } },
          },
          {
            teamHome: { connect: { id: "japan" } },
            teamAway: { connect: { id: "spain" } },
          },
          {
            teamHome: { connect: { id: "costa-rica" } },
            teamAway: { connect: { id: "germany" } },
          },
        ],
      },
    },
  ];
}
