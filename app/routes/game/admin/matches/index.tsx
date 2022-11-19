import type { Prisma } from "@prisma/client";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";

import { db } from "~/utils/db.server";
import { requireAdminUser } from "~/utils/session.server";
import type { UsersRanking } from "./$matchId";
import { compareMatch, getRankingPoints } from "./$matchId";

type TournamentMatches = Prisma.TournamentMatchGetPayload<{
  select: {
    id: true;
    homeTeamScore: true;
    awayTeamScore: true;
    goalScorer: true;
    match: {
      select: {
        id: true;
        group: { select: { name: true } };
        playoff: { select: { name: true } };
        homeTeam: { select: { name: true } };
        awayTeam: { select: { name: true } };
        stadium: { select: { name: true } };
        startDate: true;
      };
    };
  };
}>;

interface LoaderData {
  tournamentMatches: TournamentMatches[];
}

export const loader: LoaderFunction = async ({ request }) => {
  await requireAdminUser(request);

  /* Pobieranie meczów odbywających się na turnieju */

  const tournamentMatches = await db.tournamentMatch.findMany({
    orderBy: { match: { startDate: "asc" } },
    select: {
      id: true,
      homeTeamScore: true,
      awayTeamScore: true,
      goalScorer: true,
      match: {
        select: {
          id: true,
          group: { select: { name: true } },
          playoff: { select: { name: true } },
          homeTeam: { select: { name: true } },
          awayTeam: { select: { name: true } },
          stadium: { select: { name: true } },
          startDate: true,
        },
      },
    },
  });

  return json({ tournamentMatches });
};

export const action: ActionFunction = async ({ request, params }) => {
  await requireAdminUser(request);

  /* Pobieranie meczów użytkownika i meczów "realnych" */

  const usersMatches = await db.userMatch.findMany({
    where: { homeTeamScore: { not: null }, awayTeamScore: { not: null } },
  });

  const tournamentMatches = await db.tournamentMatch.findMany({
    where: { homeTeamScore: { not: null }, awayTeamScore: { not: null } },
    include: {
      match: {
        select: { id: true, homeTeamId: true, awayTeamId: true, stageId: true },
      },
    },
  });

  const usersRanking = usersMatches.reduce((acc, userMatch) => {
    const { userId } = userMatch;

    const groupMatch = compareMatch({
      tournamentMatches,
      userMatch,
      stageId: "group",
    });

    const playoffMatch = compareMatch({
      tournamentMatches,
      userMatch,
      stageId: "playoff",
    });

    const groupPoints =
      (userId in acc ? acc[userId].groupPoints : 0) +
      getRankingPoints(groupMatch, userMatch);

    const playoffPoints =
      (userId in acc ? acc[userId].playoffPoints : 0) +
      getRankingPoints(playoffMatch, userMatch);

    const totalPoints = groupPoints + playoffPoints;

    acc[userId] = { userId, groupPoints, totalPoints, playoffPoints };

    return acc;
  }, {} as { [userId: string]: UsersRanking });

  /* Aktualizacja rankingów użytkowników */

  for (const userRanking of Object.values(usersRanking)) {
    await db.userRanking.updateMany({
      where: { userId: userRanking.userId },
      data: {
        groupPoints: userRanking.groupPoints,
        playoffPoints: userRanking.playoffPoints,
        totalPoints: userRanking.totalPoints,
      },
    });
  }

  return redirect(`/game`);
};

export default function AdminMatchesRoute() {
  const { tournamentMatches } = useLoaderData<LoaderData>();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center bg-bright-blue p-4 rounded-md">
        <h1 className="text-white font-medium">Tournament Matches</h1>

        <Form method="post">
          <button className="border border-black px-4 py-2 rounded-md">
            Generate ranking
          </button>
        </Form>
      </div>

      <ul className="flex flex-col gap-4">
        {tournamentMatches.map((tournamentMatch) => (
          <li
            key={tournamentMatch.id}
            className="flex justify-between items-center p-4 bg-white rounded-md"
          >
            <div>
              <span>
                {tournamentMatch.match.homeTeam?.name ?? "Team A"}{" "}
                {`(${tournamentMatch.homeTeamScore ?? "-"})`}
              </span>
              -
              <span>
                {tournamentMatch.match.awayTeam?.name ?? "Team B"}{" "}
                {`(${tournamentMatch.awayTeamScore ?? "-"})`}
              </span>{" "}
              <span>
                {tournamentMatch.match.group?.name ??
                  tournamentMatch.match.playoff?.name}
              </span>
            </div>

            <Link
              to={`/game/admin/matches/match-${tournamentMatch.match.id}`}
              className="bg-orange p-2 rounded-md border-b-4 border-solid border-maroon font-bold text-maroon"
            >
              Bet Match
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
