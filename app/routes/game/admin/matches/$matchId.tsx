import type { Prisma, UserMatch } from "@prisma/client";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";

import { db } from "~/utils/db.server";
import { requireAdminUser } from "~/utils/session.server";

/* Funkcje pomocnicze */

interface Utility {
  userMatch: UserMatch;
  tournamentMatches: TournamentMatchesWithMatch[];
  stageId: "group" | "playoff";
}

export const compareMatch = ({
  userMatch,
  tournamentMatches,
  stageId,
}: Utility) =>
  tournamentMatches.find(
    (tournamentMatch) =>
      tournamentMatch.match.id === userMatch.matchId &&
      tournamentMatch.match.stageId === stageId
  );

const getResultType = (homeTeamScore: number, awayTeamScore: number) => {
  if (homeTeamScore > awayTeamScore) return "HOME";

  if (homeTeamScore < awayTeamScore) return "AWAY";

  if (homeTeamScore === awayTeamScore) return "DRAW";

  return null;
};

export function getRankingPoints(
  tournamentMatch: TournamentMatchesWithMatch | undefined,
  userMatch: UserMatch
) {
  const tournamentMatchResultType = getResultType(
    Number(tournamentMatch?.homeTeamScore),
    Number(tournamentMatch?.awayTeamScore)
  );
  const userMatchResultType = getResultType(
    Number(userMatch?.homeTeamScore),
    Number(userMatch?.awayTeamScore)
  );

  const isScoreEqual =
    tournamentMatch?.homeTeamScore === userMatch.homeTeamScore &&
    tournamentMatch?.awayTeamScore === userMatch.awayTeamScore;

  let rankingPoints = 0;

  if (isScoreEqual) {
    rankingPoints += 3;
  }

  if (!isScoreEqual && tournamentMatchResultType === userMatchResultType)
    rankingPoints += 1;

  if (tournamentMatch?.goalScorerId === userMatch.goalScorerId)
    rankingPoints += 1;

  return rankingPoints;
}

/* Funkcja walidująca request */

const badRequest = (data: ActionData) => json(data, { status: 400 });

/* Typy dla Action */

type TournamentMatchesWithMatch = Prisma.TournamentMatchGetPayload<{
  include: {
    match: {
      select: { id: true; homeTeamId: true; awayTeamId: true; stageId: true };
    };
  };
}>;

export type UsersRanking = {
  userId: string;
  groupPoints: number;
  totalPoints: number;
  playoffPoints: number;
};

type HiddenActionField = {
  homeTeamId: string;
  awayTeamId: string;
};

type ActionFields = {
  hidden: HiddenActionField;
  homeTeamScore: string;
  awayTeamScore: string;
  goalScorerId: string;
};

type ActionData = {
  formError?: string;
  fieldErrors?: {
    goalScorerId: string | undefined;
  };
  fields?: ActionFields;
};

/* Typy dla określania zawodnika */

type PlayerWithTournamentMatches = Prisma.PlayerGetPayload<{
  select: {
    id: true;
    name: true;
    team: true;
    teamId: true;
    tournamentMatches: { select: { goalScorerId: true } };
  };
}>;

/* Typy dla określania wyniku */

type TournamentMatch = Prisma.TournamentMatchGetPayload<{
  select: {
    id: true;
    homeTeamScore: true;
    awayTeamScore: true;
    goalScorerId: true;
    match: {
      select: {
        id: true;
        stageId: true;
        group: { select: { id: true; name: true } };
        homeTeam: { select: { id: true; name: true } };
        awayTeam: { select: { id: true; name: true } };
        stadium: { select: { id: true; name: true } };
        startDate: true;
      };
    };
  };
}>;

interface LoaderData {
  tournamentMatch: TournamentMatch;
  homeTeamPlayers: PlayerWithTournamentMatches[];
  awayTeamPlayers: PlayerWithTournamentMatches[];
}

export const loader: LoaderFunction = async ({ request, params }) => {
  await requireAdminUser(request);

  const matchId = Number(params.matchId?.split("-")[1]);

  /* Pobieranie meczu "realnego" */

  const tournamentMatch = await db.tournamentMatch.findFirst({
    where: { match: { id: matchId } },
    orderBy: [{ match: { startDate: "asc" } }],
    select: {
      id: true,
      homeTeamScore: true,
      awayTeamScore: true,
      goalScorerId: true,
      match: {
        select: {
          id: true,
          stageId: true,
          group: { select: { id: true, name: true } },
          homeTeam: { select: { id: true, name: true } },
          awayTeam: { select: { id: true, name: true } },
          stadium: { select: { id: true, name: true } },
          startDate: true,
        },
      },
    },
  });

  /* Pobieranie zawodników w danym meczu */

  const homeTeamId = String(tournamentMatch?.match.homeTeam?.id);
  const awayTeamId = String(tournamentMatch?.match.awayTeam?.id);

  const players = await db.player.findMany({
    where: { teamId: { in: [homeTeamId, awayTeamId] } },
    select: {
      id: true,
      name: true,
      team: true,
      teamId: true,
      tournamentMatches: { select: { goalScorerId: true }, where: { matchId } },
    },
  });

  const homeTeamPlayers = players.filter(({ teamId }) => teamId === homeTeamId);
  const awayTeamPlayers = players.filter(({ teamId }) => teamId === awayTeamId);

  return json({ tournamentMatch, homeTeamPlayers, awayTeamPlayers });
};

export const action: ActionFunction = async ({ request, params }) => {
  await requireAdminUser(request);

  const matchId = Number(params.matchId?.split("-")[1]);

  const form = await request.formData();

  const hidden = form.get("hidden") as string;
  const hiddenFields = JSON.parse(hidden) as HiddenActionField;
  const { homeTeamId, awayTeamId } = hiddenFields;

  const homeTeamScore = form.get("homeTeamScore");
  const awayTeamScore = form.get("awayTeamScore");
  const goalScorerId = form.get("goalScorerId");

  if (!homeTeamId || !awayTeamId) {
    return badRequest({ formError: "Teams have not yet been selected." });
  }

  if (!homeTeamScore || !awayTeamScore) {
    return badRequest({ formError: "No result selected." });
  }

  if (!goalScorerId) {
    return badRequest({ formError: "No player selected." });
  }

  /* Aktualizacja meczu "realnego" */

  await db.tournamentMatch.updateMany({
    where: { matchId },
    data: {
      goalScorerId: Number(goalScorerId),
      homeTeamScore: Number(homeTeamScore),
      awayTeamScore: Number(awayTeamScore),
    },
  });

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
    await db.userRanking.update({
      where: { userId: userRanking.userId },
      data: {
        groupPoints: userRanking.groupPoints,
        playoffPoints: userRanking.playoffPoints,
        totalPoints: userRanking.totalPoints,
      },
    });
  }

  return redirect(`/game/admin/matches`);
};

export default function AdminMatchRoute() {
  const actionData = useActionData<ActionData>();
  const { tournamentMatch, homeTeamPlayers, awayTeamPlayers } =
    useLoaderData<LoaderData>();

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-bright-blue p-4 rounded-md">
        <h1 className="text-white font-medium">
          Match Setting for {tournamentMatch.match.homeTeam?.name ?? "Team A"} -{" "}
          {tournamentMatch.match.awayTeam?.name ?? "Team B"}
        </h1>
      </div>

      <Form method="post" className="flex flex-col gap-4">
        <div className="bg-white p-4 rounded-md">
          {/* Hidden field */}
          <input
            hidden
            name="hidden"
            defaultValue={JSON.stringify({
              homeTeamId: tournamentMatch.match.homeTeam?.id,
              awayTeamId: tournamentMatch.match.awayTeam?.id,
            })}
          />
          {/* Hidden field */}
          <span>
            <label htmlFor="homeTeamScore">
              {tournamentMatch.match.homeTeam?.name}
            </label>

            <input
              id="homeTeamScore"
              type="number"
              name="homeTeamScore"
              defaultValue={tournamentMatch.homeTeamScore ?? ""}
              min="0"
              className="border border-maroon"
            />
          </span>
          -
          <span>
            <label htmlFor="awayTeamScore">
              {tournamentMatch.match.awayTeam?.name}
            </label>

            <input
              id="awayTeamScore"
              type="number"
              name="awayTeamScore"
              defaultValue={tournamentMatch.awayTeamScore ?? ""}
              min="0"
              className="border border-maroon"
            />
          </span>
        </div>

        <ul className="flex gap-4">
          <div className="flex flex-col flex-1 gap-1">
            <div className="text-white">
              {tournamentMatch.match.homeTeam?.name ?? "A"} Team Players
            </div>

            {homeTeamPlayers?.map((player) => (
              <li
                key={player.id}
                className="flex justify-between px-4 py-1 bg-white rounded-md"
              >
                <label htmlFor={`goalScorerId[${player.id}]`}>
                  {player.name}
                </label>

                <input
                  id={`goalScorerId[${player.id}]`}
                  type="radio"
                  name="goalScorerId"
                  defaultValue={player.id}
                  defaultChecked={
                    player.id === player.tournamentMatches[0]?.goalScorerId
                  }
                />
              </li>
            ))}
          </div>

          <div className="flex flex-col flex-1 gap-1">
            <div className="text-white">
              {tournamentMatch.match.awayTeam?.name ?? "B"} Team Players
            </div>

            {awayTeamPlayers.map((player) => (
              <li
                key={player.id}
                className="flex justify-between px-4 py-1 bg-white rounded-md"
              >
                <label htmlFor={`goalScorerId[${player.id}]`}>
                  {player.name}
                </label>

                <input
                  id={`goalScorerId[${player.id}]`}
                  type="radio"
                  name="goalScorerId"
                  defaultValue={player.id}
                  defaultChecked={
                    player.id === player.tournamentMatches[0]?.goalScorerId
                  }
                />
              </li>
            ))}
          </div>
        </ul>

        {actionData?.formError ? (
          <div id="form-error-message">
            <p role="alert" className="text-xs text-red-700">
              {actionData.formError}
            </p>
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-orange p-4 rounded-md border-b-4 border-solid border-bright-blue font-bold text-maroon"
          >
            Save
          </button>
        </div>
      </Form>
    </div>
  );
}
