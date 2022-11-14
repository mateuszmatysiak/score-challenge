import type { Match, User } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const seedUsers = [
  {
    username: "test",
    passwordHash:
      "$2y$10$aOufTP3luUvQikj/1UHQHOwc5qHWfrL3VU5EZjUVdA/HyST5D.lbC",
  },
  // {
  //   username: "test2",
  //   passwordHash:
  //     "$2y$10$aOufTP3luUvQikj/1UHQHOwc5qHWfrL3VU5EZjUVdA/HyST5D.lbC",
  // },
];

const seedMatches = [
  {
    teamHome: "Qatar",
    teamAway: "Ecuador",
    groupName: "A",
  },
  {
    teamHome: "Senegal",
    teamAway: "Netherlands",
    groupName: "A",
  },
  {
    teamHome: "Qatar",
    teamAway: "Senegal",
    groupName: "A",
  },
  {
    teamHome: "Netherlands",
    teamAway: "Ecuador",
    groupName: "A",
  },
  {
    teamHome: "Ecuador",
    teamAway: "Senegal",
    groupName: "A",
  },
  {
    teamHome: "Netherlands",
    teamAway: "Qatar",
    groupName: "A",
  },

  {
    teamHome: "England",
    teamAway: "Iran",
    groupName: "B",
  },
  {
    teamHome: "USA",
    teamAway: "Wales",
    groupName: "B",
  },
  {
    teamHome: "Wales",
    teamAway: "Iran",
    groupName: "B",
  },
  {
    teamHome: "England",
    teamAway: "USA",
    groupName: "B",
  },
  {
    teamHome: "Wales",
    teamAway: "England",
    groupName: "B",
  },
  {
    teamHome: "Iran",
    teamAway: "USA",
    groupName: "B",
  },
];

const seedUserMatches = ({
  users,
  matches,
}: {
  users: User[];
  matches: Match[];
}) => {
  const userMatches: { userId: string; matchId: number }[] = [];

  for (const user of users) {
    for (const match of matches) {
      userMatches.push({ userId: user.id, matchId: match.id });
    }
  }

  return userMatches;
};

async function seed() {
  await db.user.createMany({ data: seedUsers });

  await db.match.createMany({ data: seedMatches });

  const users = await db.user.findMany();
  const matches = await db.match.findMany();

  const userMatches = await Promise.all(seedUserMatches({ users, matches }));

  await db.userMatch.createMany({ data: userMatches });
}

seed();
