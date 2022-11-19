import type { Prisma } from "@prisma/client";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";

import { db } from "~/utils/db.server";
import { getUserId } from "~/utils/session.server";

/* Funkcja pomocnicze */

type Utility = {
  homeTeamScore: number;
  awayTeamScore: number;
  teamIdType: "homeTeamId" | "awayTeamId";
};

const getPoints = ({ homeTeamScore, awayTeamScore, teamIdType }: Utility) => {
  if (homeTeamScore === awayTeamScore) return 1;

  if (teamIdType === "homeTeamId") {
    return homeTeamScore > awayTeamScore ? 3 : 0;
  }

  if (teamIdType === "awayTeamId") {
    return homeTeamScore < awayTeamScore ? 3 : 0;
  }

  return 0;
};

const getGD = ({ homeTeamScore, awayTeamScore, teamIdType }: Utility) => {
  if (teamIdType === "homeTeamId") return homeTeamScore - awayTeamScore;

  if (teamIdType === "awayTeamId") return awayTeamScore - homeTeamScore;

  return 0;
};

/* Funkcja walidująca request */

const badRequest = (data: ActionData) => json(data, { status: 400 });

/* Typy dla Action */

type HiddenActionField = {
  userMatchId: number;
  matchStartDate: string;
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

/* Typy dla określania wyniku */

type UserMatch = Prisma.UserMatchGetPayload<{
  select: {
    id: true;
    homeTeamScore: true;
    awayTeamScore: true;
    match: {
      select: {
        id: true;
        group: { select: { id: true; name: true } };
        homeTeam: { select: { id: true; name: true } };
        awayTeam: { select: { id: true; name: true } };
        stadium: { select: { id: true; name: true } };
        startDate: true;
      };
    };
  };
}>;

/* Typy dla określania zawodnika */

type Player = Prisma.PlayerGetPayload<{
  select: {
    id: true;
    name: true;
    team: true;
    teamId: true;
    userMatches: { select: { goalScorerId: true } };
  };
}>;

/* Typy dla Loader */

interface LoaderData {
  userMatch: UserMatch;
  homeTeamPlayers: Player[];
  awayTeamPlayers: Player[];
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await getUserId(request);

  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const matchId = Number(params.matchId?.split("-")[1]);

  /* Pobieranie meczu użytkownika */

  const userMatch = await db.userMatch.findFirst({
    where: { userId, match: { id: matchId } },
    orderBy: { match: { startDate: "asc" } },
    select: {
      id: true,
      homeTeamScore: true,
      awayTeamScore: true,
      match: {
        select: {
          id: true,
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

  const homeTeamId = String(userMatch?.match.homeTeam?.id);
  const awayTeamId = String(userMatch?.match.awayTeam?.id);

  const players = await db.player.findMany({
    where: { teamId: { in: [homeTeamId, awayTeamId] } },
    select: {
      id: true,
      name: true,
      team: true,
      teamId: true,
      userMatches: {
        select: { goalScorerId: true },
        where: { userId, matchId },
      },
    },
  });

  const homeTeamPlayers = players.filter(({ teamId }) => teamId === homeTeamId);
  const awayTeamPlayers = players.filter(({ teamId }) => teamId === awayTeamId);

  return json({ userMatch, homeTeamPlayers, awayTeamPlayers });
};

export const action: ActionFunction = async ({ request, params }) => {
  const userId = await getUserId(request);

  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const groupId = params.groupId;

  const form = await request.formData();

  const hidden = form.get("hidden") as string;
  const hiddenFields = JSON.parse(hidden) as HiddenActionField;
  const { userMatchId, matchStartDate } = hiddenFields;

  const homeTeamScore = form.get("homeTeamScore");
  const awayTeamScore = form.get("awayTeamScore");
  const goalScorerId = form.get("goalScorerId");

  const currentDateMs = Date.now();
  const matchDateMs = Date.parse(String(matchStartDate));

  if (currentDateMs > matchDateMs) {
    return badRequest({ formError: "Match has started, cannot change bets." });
  }

  if (!homeTeamScore || !awayTeamScore) {
    return badRequest({ formError: "No result selected." });
  }

  if (!goalScorerId) {
    return badRequest({ formError: "No player selected." });
  }

  /* Aktualizacja meczu użytkownika */

  await db.userMatch.updateMany({
    where: { id: userMatchId, userId },
    data: {
      goalScorerId: Number(goalScorerId),
      homeTeamScore: Number(homeTeamScore),
      awayTeamScore: Number(awayTeamScore),
    },
  });

  /* Pobieranie meczów użytkownika */

  const userMatches = await db.userMatch.findMany({
    where: {
      match: { groupId },
      homeTeamScore: { not: null },
      awayTeamScore: { not: null },
    },
    include: { match: { select: { homeTeamId: true, awayTeamId: true } } },
  });

  /* Formatowanie meczów */

  const formatUserMatches = (teamIdType: "homeTeamId" | "awayTeamId") =>
    userMatches.map((userMatch) => {
      const homeTeamScore = Number(userMatch.homeTeamScore);
      const awayTeamScore = Number(userMatch.awayTeamScore);

      return {
        teamId: String(userMatch.match[teamIdType]),
        points: getPoints({ homeTeamScore, awayTeamScore, teamIdType }),
        goalDifference: getGD({ homeTeamScore, awayTeamScore, teamIdType }),
      };
    });

  const userHomeTeamsPointsAndGD = formatUserMatches("homeTeamId");
  const userAwayTeamsPointsAndGD = formatUserMatches("awayTeamId");

  const userTeamsPointsAndGD = [
    ...userHomeTeamsPointsAndGD,
    ...userAwayTeamsPointsAndGD,
  ];

  /* Grupowanie po drużynie */

  const groupedTeams = userTeamsPointsAndGD.reduce(
    (acc, { teamId, points, goalDifference }) => {
      acc[teamId] = {
        teamId: teamId,
        points: (teamId in acc ? acc[teamId].points : 0) + points,
        goalDifference:
          (teamId in acc ? acc[teamId].goalDifference : 0) + goalDifference,
      };

      return acc;
    },
    {} as {
      [teamId: string]: {
        teamId: string;
        points: number;
        goalDifference: number;
      };
    }
  );

  /* Aktualizacja points i goalDifference wszystkich drużyn w danej grupie */

  for (const team of Object.values(groupedTeams)) {
    await db.userTeam.updateMany({
      where: { teamId: team.teamId, userId },
      data: { points: team.points, goalDifference: team.goalDifference },
    });
  }

  return redirect(`/game/group-stage/${params.groupId}`);
};

export default function GroupMatchRoute() {
  const actionData = useActionData<ActionData>();
  const { userMatch, homeTeamPlayers, awayTeamPlayers } =
    useLoaderData<LoaderData>();

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-bright-blue p-4 rounded-md">
        <h1 className="text-white font-medium">
          Match Betting for {userMatch.match?.homeTeam?.name ?? "?"} -{" "}
          {userMatch.match?.awayTeam?.name ?? "?"}
        </h1>
      </div>

      <Form method="post" className="flex flex-col gap-4">
        <div className="bg-white p-4 rounded-md">
          {/* Hidden field */}
          <input
            hidden
            name="hidden"
            defaultValue={JSON.stringify({
              userMatchId: userMatch.id,
              matchStartDate: userMatch.match.startDate,
            })}
          />
          {/* Hidden field */}
          <span>
            <label htmlFor="homeTeamScore">
              {userMatch.match.homeTeam?.name}
            </label>

            <input
              id="homeTeamScore"
              type="number"
              name="homeTeamScore"
              defaultValue={userMatch.homeTeamScore ?? ""}
              min="0"
              className="border border-maroon"
            />
          </span>
          -
          <span>
            <label htmlFor="awayTeamScore">
              {userMatch.match.awayTeam?.name}
            </label>

            <input
              id="awayTeamScore"
              type="number"
              name="awayTeamScore"
              defaultValue={userMatch.awayTeamScore ?? ""}
              min="0"
              className="border border-maroon"
            />
          </span>
        </div>

        <ul className="flex gap-4">
          <div className="flex flex-col flex-1 gap-1">
            <div className="text-white">
              {userMatch.match.homeTeam?.name} Team Players
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
                    player.id === player.userMatches[0]?.goalScorerId
                  }
                />
              </li>
            ))}
          </div>

          <div className="flex flex-col flex-1 gap-1">
            <div className="text-white">
              {userMatch.match.awayTeam?.name} Team Players
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
                    player.id === player.userMatches[0]?.goalScorerId
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
