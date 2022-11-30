import type { Match } from "@prisma/client";

type SeedUserMatchesArgs = { userId: string; matches: Match[] };

export const seedUserMatches = ({ userId, matches }: SeedUserMatchesArgs) => {
  const userMatches: { userId: string; matchId: number }[] = [];

  for (const match of matches) {
    userMatches.push({ userId, matchId: match.id });
  }

  return userMatches;
};

type SeedTournamentMatchesArgs = { matches: Match[] };

export const seedTournamentMatches = ({
  matches,
}: SeedTournamentMatchesArgs) => {
  const tournamentMatches: { matchId: number }[] = [];

  for (const match of matches) {
    tournamentMatches.push({ matchId: match.id });
  }

  return tournamentMatches;
};
