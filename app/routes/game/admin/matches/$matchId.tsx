import type { Prisma, UserMatch } from "@prisma/client";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  useActionData,
  useCatch,
  useLoaderData,
  useParams,
} from "@remix-run/react";
import { Fragment } from "react";
import { ErrorCard } from "~/components/error-card";
import { GoalScorer } from "~/components/match-card/form/goal-scorer";
import { NoGoalScorer } from "~/components/match-card/form/no-goal-scorer";
import { MatchCardDetails } from "~/components/match-card/details";
import { SubmitButton } from "~/components/submit-button";

import { db } from "~/utils/db.server";
import { requireAdminUser } from "~/utils/session.server";
import { MatchCardTeamFlag } from "~/components/match-card/flag";

/* Funkcje pomocnicze */

interface CompareMatchArgs {
  userMatch: UserMatch;
  tournamentMatches: TournamentMatchesWithMatch[];
  stageId: "group" | "playoff";
}

const compareMatch = ({
  userMatch,
  tournamentMatches,
  stageId,
}: CompareMatchArgs) =>
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

function getRankingPoints(
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

  if (
    typeof tournamentMatch?.goalScorerId === "number" &&
    tournamentMatch?.goalScorerId === userMatch.goalScorerId
  )
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

type UsersRanking = {
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
        group: true;
        playoff: true;
        homeTeam: true;
        awayTeam: true;
        stadium: true;
        stage: true;
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
          group: true,
          playoff: true,
          homeTeam: true,
          awayTeam: true,
          stadium: true,
          stage: true,
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

  /* Aktualizacja meczu "realnego" */

  await db.tournamentMatch.updateMany({
    where: { matchId },
    data: {
      goalScorerId: Number(goalScorerId) !== 0 ? Number(goalScorerId) : null,
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

  const { match, goalScorerId } = tournamentMatch;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-48-bold max-sm:text-30-bold">
        Tournament Match Setting
      </h1>

      <div className="flex flex-col bg-white rounded-md p-6 gap-6">
        <MatchCardDetails match={match} />

        <Form method="post" className="flex flex-col gap-6">
          <div className="grid grid-cols-match-form-card items-center gap-4 max-xl:flex max-xl:flex-col">
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

            <div className="flex items-center justify-end gap-4 max-xl:gap-2">
              <label
                htmlFor="homeTeamScore"
                className="text-48-bold max-sm:text-24-bold max-xl:order-1"
              >
                {tournamentMatch.match.homeTeam?.name ?? "Team A"}
              </label>
              <MatchCardTeamFlag
                type="large"
                src={tournamentMatch.match.homeTeam?.flag}
                alt={tournamentMatch.match.homeTeam?.name}
              />
            </div>
            <div className="m-auto">
              <input
                id="homeTeamScore"
                type="number"
                name="homeTeamScore"
                defaultValue={tournamentMatch.homeTeamScore ?? ""}
                min="0"
                aria-label="Enter home team score"
                className="w-[80px] border-b-2 border-dark-blue text-center text-48-bold max-sm:text-30-bold"
              />
              <span> - </span>
              <input
                id="awayTeamScore"
                type="number"
                name="awayTeamScore"
                defaultValue={tournamentMatch.awayTeamScore ?? ""}
                min="0"
                aria-label="Enter away team score"
                className="w-[80px] border-b-2 border-dark-blue text-center text-48-bold max-sm:text-30-bold"
              />
            </div>
            <div className="flex items-center justify-start gap-4 max-xl:gap-2">
              <MatchCardTeamFlag
                type="large"
                src={tournamentMatch.match.awayTeam?.flag}
                alt={tournamentMatch.match.awayTeam?.name}
              />
              <label
                htmlFor="awayTeamScore"
                className="text-48-bold max-sm:text-24-bold"
              >
                {tournamentMatch.match.awayTeam?.name ?? "Team B"}
              </label>
            </div>
          </div>

          <hr />

          <NoGoalScorer goalScorerId={goalScorerId} />

          <div className="flex gap-4 max-md:flex-col">
            <ul className="flex flex-col flex-1 gap-1">
              <li className="text-24-bold mb-2">
                {tournamentMatch.match.homeTeam?.name} Team Players
              </li>

              {homeTeamPlayers?.map((player, index) => (
                <Fragment key={player.id}>
                  <GoalScorer {...player} />

                  {index !== homeTeamPlayers.length - 1 ? <hr /> : null}
                </Fragment>
              ))}
            </ul>

            <ul className="flex flex-col flex-1 gap-1">
              <li className="text-24-bold mb-2">
                {tournamentMatch.match.awayTeam?.name} Team Players
              </li>

              {awayTeamPlayers.map((player, index) => (
                <Fragment key={player.id}>
                  <GoalScorer {...player} />

                  {index !== awayTeamPlayers.length - 1 ? <hr /> : null}
                </Fragment>
              ))}
            </ul>
          </div>

          {actionData?.formError ? (
            <ErrorCard>{actionData.formError}</ErrorCard>
          ) : null}

          <div className="flex justify-end">
            <SubmitButton />
          </div>
        </Form>
      </div>
    </div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  const params = useParams();

  if (caught.status === 404) {
    return (
      <p className="text-20-medium mb-4">
        Match with id "{params.matchId}" not found.
      </p>
    );
  }
  throw new Error(`Unhandled error: ${caught.status}`);
}

export function ErrorBoundary() {
  const { matchId } = useParams();
  return (
    <p className="text-20-medium">{`There was an error loading match by the id ${matchId}. Sorry.`}</p>
  );
}
