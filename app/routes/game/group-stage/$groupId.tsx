import type { Stadium } from "@prisma/client";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import qs from "qs";

import { db } from "~/utils/db.server";
import { getUserId } from "~/utils/session.server";

type ActionData = {
  formError?: string;
  fieldErrors?: {
    matches: string | undefined;
  };
  fields?: {
    matches: MatchWithScores[];
  };
};

export const badRequest = (data: ActionData) => json(data, { status: 400 });

interface Team {
  score: number | null;
  id: string;
  name: string;
}

interface Match {
  id: number;
  homeTeam: Team;
  awayTeam: Team;
  stadium: Stadium;
  startDate: Date;
}

interface Group {
  name: string;
  matches: Match[];
}

interface LoaderData {
  group: Group;
}

interface GetPoints {
  homeTeamScore: number;
  awayTeamScore: number;
  type: "HOME" | "AWAY";
}

/* Funkcja zwracająca liczbę punktów */

const getPoints = ({ homeTeamScore, awayTeamScore, type }: GetPoints) => {
  if (homeTeamScore === awayTeamScore) return 1;

  if (type === "HOME") {
    if (homeTeamScore > awayTeamScore) return 3;
  } else {
    if (homeTeamScore < awayTeamScore) return 3;
  }

  return 0;
};

/* Funkcja walidująca mecze */

function validateMatchScores(scores: MatchWithScores[]) {
  const isEmptyScoreInSomeMatch = scores.some((score) => {
    return !score.homeTeamScore.length || !score.awayTeamScore.length;
  });

  if (isEmptyScoreInSomeMatch) {
    return `Some match has empty score input text`;
  }
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await getUserId(request);

  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  /* Pobieranie meczów użytkownika */

  const matches = await db.userMatch.findMany({
    where: { userId, match: { groupId: params.groupId } },
    orderBy: [{ match: { startDate: "asc" } }],
    select: {
      id: true,
      homeTeamScore: true,
      awayTeamScore: true,
      match: {
        select: {
          group: { select: { name: true } },
          homeTeam: { select: { id: true, name: true } },
          awayTeam: { select: { id: true, name: true } },
          stadium: { select: { id: true, name: true } },
          startDate: true,
        },
      },
    },
  });

  /* Formatowanie grup */

  const formattedGroup = {
    name: matches[0]?.match.group.name,
    matches: matches.map(({ match, homeTeamScore, awayTeamScore, id }) => {
      const { awayTeam, homeTeam, stadium, startDate } = match;
      return {
        id,
        homeTeam: { ...homeTeam, score: homeTeamScore },
        awayTeam: { ...awayTeam, score: awayTeamScore },
        stadium,
        startDate,
      };
    }),
  };

  return json({ group: formattedGroup });
};

type MatchWithScores = {
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamScore: string;
  awayTeamScore: string;
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await getUserId(request);

  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  /* Formatowanie i pobieranie danych z formularza */

  const text = await request.text();
  const formData = qs.parse(text);
  const matches = [...(formData.matches as MatchWithScores[])];

  const fields = { matches };
  const fieldErrors = { matches: validateMatchScores(matches) };

  /* Walidacja formularza */

  if (Object.values(fieldErrors).some(Boolean))
    return badRequest({ fieldErrors, fields });

  /* Formatowanie danych z formularza */

  const scoreMatchesAsNumber = matches.map(
    ({ homeTeamScore, awayTeamScore, matchId, ...value }) => ({
      ...value,
      matchId: Number(matchId),
      homeTeamScore: Number(homeTeamScore),
      awayTeamScore: Number(awayTeamScore),
    })
  );

  /* Formatowanie formularza dla homeTeam */

  const homeTeamWithPointsAndGd = scoreMatchesAsNumber.map(
    ({ homeTeamScore, awayTeamScore, ...value }) => ({
      teamId: value.homeTeamId,
      points: getPoints({ homeTeamScore, awayTeamScore, type: "HOME" }),
      goalDifference: homeTeamScore - awayTeamScore,
    })
  );

  /* Formatowanie formularza dla awayTeam */

  const awayTeamWithPointsAndGd = scoreMatchesAsNumber.map(
    ({ homeTeamScore, awayTeamScore, ...value }) => ({
      teamId: value.awayTeamId,
      points: getPoints({ homeTeamScore, awayTeamScore, type: "AWAY" }),
      goalDifference: awayTeamScore - homeTeamScore,
    })
  );

  /* Połączenie dwóch tablic w jedną */

  const mergedTeams = [...homeTeamWithPointsAndGd, ...awayTeamWithPointsAndGd];

  /* Grupowanie drużyn */

  const teamWithPointsAndGd = mergedTeams.reduce((acc: any, team) => {
    acc[team.teamId] = {
      teamId: team.teamId,
      points: (team.teamId in acc ? acc[team.teamId].points : 0) + team.points,
      goalDifference:
        (team.teamId in acc ? acc[team.teamId].goalDifference : 0) +
        team.goalDifference,
    };

    return acc;
  }, {});

  /* Aktualizacja wyników drużyn */

  for (const {
    matchId,
    homeTeamScore,
    awayTeamScore,
  } of scoreMatchesAsNumber) {
    await db.userMatch.updateMany({
      where: { id: matchId, userId },
      data: { homeTeamScore, awayTeamScore },
    });
  }

  /* Aktualizacja punktów i różnic bramek drużyn */

  for (const team of Object.values(teamWithPointsAndGd) as any) {
    await db.userTeam.updateMany({
      where: { teamId: team.teamId, userId },
      data: { points: team.points, goalDifference: team.goalDifference },
    });
  }

  /* TODO: Aktualizacja rankingu użytkownika */

  return redirect("/game/group-stage");
};

export default function GroupMatchesRoute() {
  const actionData = useActionData<ActionData>();
  const { group } = useLoaderData<LoaderData>();

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-bright-blue p-4 rounded-md">
        <h1 className="text-white font-medium">Group {group.name} Matches</h1>
      </div>

      <Form method="post" className="flex flex-col gap-4">
        <ul className="flex flex-col gap-4">
          {group.matches.map((match, index) => (
            <li key={match.id} className="p-4 bg-white rounded-md">
              <input
                hidden
                name={`matches[${index}][matchId]`}
                defaultValue={match.id ?? ""}
              />
              <input
                hidden
                name={`matches[${index}][homeTeamId]`}
                defaultValue={match.homeTeam.id ?? ""}
              />
              <input
                hidden
                name={`matches[${index}][awayTeamId]`}
                defaultValue={match.awayTeam.id ?? ""}
              />
              <label>
                {match.homeTeam.name}
                <input
                  type="number"
                  name={`matches[${index}][homeTeamScore]`}
                  defaultValue={match.homeTeam.score ?? ""}
                  min="0"
                  className="border border-maroon"
                />
              </label>
              -
              <label>
                {match.awayTeam.name}
                <input
                  type="number"
                  name={`matches[${index}][awayTeamScore]`}
                  defaultValue={match.awayTeam.score ?? ""}
                  min="0"
                  className="border border-maroon"
                />
              </label>
            </li>
          ))}
        </ul>

        {actionData?.fieldErrors?.matches ? (
          <div className="bg-red-600 text-white border border-white rounded-md p-4">
            <div>Error</div>
            <div>{actionData.fieldErrors.matches}</div>
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
