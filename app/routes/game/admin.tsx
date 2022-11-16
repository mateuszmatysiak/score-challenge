import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";

import type { Prisma, UserMatch } from "@prisma/client";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import qs from "qs";
import { db } from "~/utils/db.server";

type ActionData = {
  formError?: string;
  fieldErrors?: {
    tournamentMatches: string | undefined;
  };
  fields?: {
    tournamentMatches: MatchWithScores[];
  };
};

export const badRequest = (data: ActionData) => json(data, { status: 400 });

/* Funkcja walidująca mecze */

function validateMatchScores(scores: MatchWithScores[]) {
  const isEmptyScoreInSomeMatch = scores.some((score) => {
    return !score.homeTeamScore.length || !score.awayTeamScore.length;
  });

  if (isEmptyScoreInSomeMatch) {
    return `Some match has empty score input text`;
  }
}

const getWinner = ({
  homeTeamScore,
  awayTeamScore,
}: {
  homeTeamScore: number;
  awayTeamScore: number;
}) => {
  if (homeTeamScore > awayTeamScore) return "HOME";

  if (homeTeamScore < awayTeamScore) return "AWAY";

  return "DRAW";
};

const getRankingPoints = (comparingMatch: any, userMatch: any) => {
  const isHomeScoreOk =
    comparingMatch.homeTeamScore === userMatch.homeTeamScore;
  const isAwayScoreOk =
    comparingMatch.homeTeamScore === userMatch.homeTeamScore;

  if (isHomeScoreOk && isAwayScoreOk) return 3;

  if (comparingMatch.winner === userMatch.winner) return 1;

  return 0;
};

type TournamentMatches = Prisma.TournamentMatchGetPayload<{
  select: {
    id: true;
    homeTeamScore: true;
    awayTeamScore: true;
    match: {
      select: {
        id: true;
        group: { select: { name: true } };
        homeTeam: { select: { id: true; name: true } };
        awayTeam: { select: { id: true; name: true } };
        stadium: { select: { id: true; name: true } };
        startDate: true;
      };
    };
  };
}>;

interface LoaderData {
  tournamentMatches: TournamentMatches[];
}

export const loader: LoaderFunction = async ({ request }) => {
  /* Pobieranie meczów na turnieju */

  const tournamentMatches = await db.tournamentMatch.findMany({
    orderBy: [{ match: { startDate: "asc" } }],
    select: {
      id: true,
      homeTeamScore: true,
      awayTeamScore: true,
      match: {
        select: {
          id: true,
          group: { select: { name: true } },
          homeTeam: { select: { id: true, name: true } },
          awayTeam: { select: { id: true, name: true } },
          stadium: { select: { id: true, name: true } },
          startDate: true,
        },
      },
    },
  });

  return json({ tournamentMatches });
};

type MatchWithScores = {
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamScore: string;
  awayTeamScore: string;
};

export const action: ActionFunction = async ({ request }) => {
  /* Formatowanie i pobieranie danych z formularza */

  const text = await request.text();
  const formData = qs.parse(text);
  const tournamentMatches = [...(formData.matches as MatchWithScores[])];

  const fields = { tournamentMatches };
  const fieldErrors = {
    tournamentMatches: validateMatchScores(tournamentMatches),
  };

  /* Walidacja formularza */

  if (Object.values(fieldErrors).some(Boolean))
    return badRequest({ fieldErrors, fields });

  /* Formatowanie matchId, homeTeamScore, awayTeamScore z typu string na typ number */

  const formatMatches = (data: MatchWithScores[]) =>
    data.map(({ homeTeamScore, awayTeamScore, matchId, ...value }) => ({
      ...value,
      matchId: Number(matchId),
      homeTeamScore: Number(homeTeamScore),
      awayTeamScore: Number(awayTeamScore),
    }));

  const formattedTournamentMatches = formatMatches(tournamentMatches);

  /* Aktualizacja wyników drużyn */

  for (const {
    matchId,
    homeTeamScore,
    awayTeamScore,
  } of formattedTournamentMatches) {
    await db.tournamentMatch.updateMany({
      where: { id: matchId },
      data: { homeTeamScore, awayTeamScore },
    });
  }

  /* ---- */

  const usersMatches = await db.userMatch.findMany();

  const formatMatchesWithWinnerResult = (data: any[]) =>
    data.map((tournamentMatch) => {
      const { homeTeamScore, awayTeamScore } = tournamentMatch;

      return {
        ...tournamentMatch,
        winner: getWinner({ homeTeamScore, awayTeamScore }),
      };
    });

  const formattedTournamentMatches2 = formatMatchesWithWinnerResult(
    formattedTournamentMatches
  );
  const formattedUsersMatches = formatMatchesWithWinnerResult(usersMatches);

  const usersRanking = formattedUsersMatches.reduce((acc, userMatch) => {
    const comparingMatch = formattedTournamentMatches2.find(
      (tMatch) => tMatch.matchId === userMatch.matchId
    );

    acc[userMatch.userId] = {
      userId: userMatch.userId,
      groupPoints:
        (userMatch.userId in acc ? acc[userMatch.userId].groupPoints : 0) +
        getRankingPoints(comparingMatch, userMatch),
    };

    return acc;
  }, {});

  /* Aktualizacja rankingów użytkowników */

  for (const userRanking of Object.values(usersRanking) as any) {
    await db.userRanking.updateMany({
      where: { userId: userRanking.userId },
      data: { groupPoints: userRanking.groupPoints },
    });
  }

  return redirect("/game");
};

export default function AdminRoute() {
  const actionData = useActionData<ActionData>();
  const { tournamentMatches } = useLoaderData<LoaderData>();

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-bright-blue p-4 rounded-md">
        <h1 className="text-white font-medium">Tournament Matches</h1>
      </div>

      <Form method="post" className="flex flex-col gap-4">
        <ul className="flex flex-col gap-4">
          {tournamentMatches.map((tournamentMatch, index) => (
            <li key={tournamentMatch.id} className="p-4 bg-white rounded-md">
              <input
                hidden
                name={`matches[${index}][matchId]`}
                defaultValue={tournamentMatch.match.id ?? ""}
              />
              <input
                hidden
                name={`matches[${index}][homeTeamId]`}
                defaultValue={tournamentMatch.match.homeTeam.id ?? ""}
              />
              <input
                hidden
                name={`matches[${index}][awayTeamId]`}
                defaultValue={tournamentMatch.match.awayTeam.id ?? ""}
              />
              <label>
                {tournamentMatch.match.homeTeam.name}
                <input
                  type="number"
                  name={`matches[${index}][homeTeamScore]`}
                  defaultValue={tournamentMatch.homeTeamScore ?? ""}
                  min="0"
                  className="border border-maroon"
                />
              </label>
              -
              <label>
                {tournamentMatch.match.awayTeam.name}
                <input
                  type="number"
                  name={`matches[${index}][awayTeamScore]`}
                  defaultValue={tournamentMatch.awayTeamScore ?? ""}
                  min="0"
                  className="border border-maroon"
                />
              </label>
            </li>
          ))}
        </ul>

        {actionData?.fieldErrors?.tournamentMatches ? (
          <div className="bg-red-600 text-white border border-white rounded-md p-4">
            <div>Error</div>
            <div>{actionData.fieldErrors.tournamentMatches}</div>
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
