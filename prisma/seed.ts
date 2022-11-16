import type { Match, Team, User } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const seedUsers = [
  {
    username: "test",
    passwordHash:
      "$2y$10$aOufTP3luUvQikj/1UHQHOwc5qHWfrL3VU5EZjUVdA/HyST5D.lbC",
  },
  {
    username: "test2",
    passwordHash:
      "$2y$10$aOufTP3luUvQikj/1UHQHOwc5qHWfrL3VU5EZjUVdA/HyST5D.lbC",
  },
];

const seedRanking = {
  groupPoints: 0,
  knockoutPoints: 0,
  totalPoints: 0,
};

const seedUserTeam = {
  points: 0,
  goalDifference: 0,
};

const seedStadiums = [
  {
    id: "khalifa-international-stadium",
    name: "Khalifa International Stadium",
  },
  { id: "al-thumama-stadium", name: "Al Thumama Stadium" },
  { id: "al-bayt-stadium", name: "Al Bayt Stadium" },
  { id: "lusail-iconic-stadium", name: "Lusail Iconic Stadium" },
  { id: "stadium-974", name: "Stadium 974" },
  { id: "education-city-stadium", name: "Education City Stadium" },
];

const seedGroups = [
  { id: "group-a", name: "A" },
  { id: "group-b", name: "B" },
  { id: "group-c", name: "C" },
  { id: "group-d", name: "D" },
  { id: "group-e", name: "E" },
  { id: "group-f", name: "F" },
  { id: "group-g", name: "G" },
  { id: "group-h", name: "H" },
];

const seedTeams = [
  { id: "qatar", name: "Qatar", groupId: "group-a" },
  { id: "senegal", name: "Senegal", groupId: "group-a" },
  { id: "ecuador", name: "Ecuador", groupId: "group-a" },
  { id: "netherlands", name: "Netherlands", groupId: "group-a" },
  { id: "poland", name: "Poland", groupId: "group-c" },
  { id: "mexico", name: "Mexico", groupId: "group-c" },
  { id: "argentina", name: "Argentina", groupId: "group-c" },
  { id: "saudi-arabia", name: "Saudi Arabia", groupId: "group-c" },
];

const seedMatches = [
  {
    homeTeamId: "qatar",
    awayTeamId: "ecuador",
    groupId: "group-a",
    stadiumId: "al-bayt-stadium",
    startDate: new Date("2022-11-20T19:00:00"),
  },
  {
    homeTeamId: "senegal",
    awayTeamId: "netherlands",
    groupId: "group-a",
    stadiumId: "al-thumama-stadium",
    startDate: new Date("2022-11-21T16:00:00"),
  },
  {
    homeTeamId: "qatar",
    awayTeamId: "senegal",
    groupId: "group-a",
    stadiumId: "al-thumama-stadium",
    startDate: new Date("2022-11-25T16:00:00"),
  },
  {
    homeTeamId: "netherlands",
    awayTeamId: "ecuador",
    groupId: "group-a",
    stadiumId: "khalifa-international-stadium",
    startDate: new Date("2022-11-25T19:00:00"),
  },
  {
    homeTeamId: "ecuador",
    awayTeamId: "senegal",
    groupId: "group-a",
    stadiumId: "khalifa-international-stadium",
    startDate: new Date("2022-11-29T18:00:00"),
  },
  {
    homeTeamId: "netherlands",
    awayTeamId: "qatar",
    groupId: "group-a",
    stadiumId: "al-bayt-stadium",
    startDate: new Date("2022-11-29T18:00:00"),
  },

  {
    homeTeamId: "argentina",
    awayTeamId: "saudi-arabia",
    groupId: "group-c",
    stadiumId: "lusail-iconic-stadium",
    startDate: new Date("2022-11-22T13:00:00"),
  },
  {
    homeTeamId: "mexico",
    awayTeamId: "poland",
    groupId: "group-c",
    stadiumId: "stadium-974",
    startDate: new Date("2022-11-22T19:00:00"),
  },
  {
    homeTeamId: "poland",
    awayTeamId: "saudi-arabia",
    groupId: "group-c",
    stadiumId: "education-city-stadium",
    startDate: new Date("2022-11-26T16:00:00"),
  },
  {
    homeTeamId: "argentina",
    awayTeamId: "mexico",
    groupId: "group-c",
    stadiumId: "lusail-iconic-stadium",
    startDate: new Date("2022-11-26T22:00:00"),
  },
  {
    homeTeamId: "poland",
    awayTeamId: "argentina",
    groupId: "group-c",
    stadiumId: "stadium-974",
    startDate: new Date("2022-11-30T22:00:00"),
  },
  {
    homeTeamId: "saudi-arabia",
    awayTeamId: "mexico",
    groupId: "group-c",
    stadiumId: "lusail-iconic-stadium",
    startDate: new Date("2022-11-30T22:00:00"),
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

const seedUserTeams = ({ users, teams }: { users: User[]; teams: Team[] }) => {
  const userTeams: {
    userId: string;
    teamId: string;
    points: number;
    goalDifference: number;
  }[] = [];

  for (const user of users) {
    for (const team of teams) {
      userTeams.push({ userId: user.id, teamId: team.id, ...seedUserTeam });
    }
  }

  return userTeams;
};

const seedUserRanking = ({ users }: { users: User[] }) => {
  const userRanking: {
    userId: string;
    groupPoints: number;
    knockoutPoints: number;
    totalPoints: number;
  }[] = [];

  for (const user of users) {
    userRanking.push({ userId: user.id, ...seedRanking });
  }

  return userRanking;
};

const seedTournamentMatches = ({ matches }: { matches: Match[] }) => {
  const tournamentMatches: { matchId: number }[] = [];

  for (const match of matches) {
    tournamentMatches.push({ matchId: match.id });
  }

  return tournamentMatches;
};

async function seed() {
  /* Utworzenie użytkowników */
  await db.user.createMany({ data: seedUsers });
  /* Utworzenie stadionów */
  await db.stadium.createMany({ data: seedStadiums });
  /* Utworzenie grup */
  await db.group.createMany({ data: seedGroups });
  /* Utworzenie drużyn */
  await db.team.createMany({ data: seedTeams });
  /* Utworzenie meczów */
  await db.match.createMany({ data: seedMatches });

  /* Pobranie użytkowników, meczów, drużyn */
  const users = await db.user.findMany();
  const matches = await db.match.findMany();
  const teams = await db.team.findMany();

  /* Utworzenie rankingów dla użytkowników */
  const userRanking = await Promise.all(seedUserRanking({ users }));
  await db.userRanking.createMany({ data: userRanking });

  /* Utworzenie meczów dla użytkowników */
  const userMatches = await Promise.all(seedUserMatches({ users, matches }));
  await db.userMatch.createMany({ data: userMatches });

  /* Utworzenie drużyn dla użytkowników */
  const userTeams = await Promise.all(seedUserTeams({ users, teams }));
  await db.userTeam.createMany({ data: userTeams });

  /* Utworzenie wyników spotkań dla turnieju */
  const tournamentMatches = await Promise.all(
    seedTournamentMatches({ matches })
  );
  await db.tournamentMatch.createMany({ data: tournamentMatches });
}

seed();
