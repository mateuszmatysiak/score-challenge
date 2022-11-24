import type { Prisma } from "@prisma/client";
import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useCatch, useLoaderData } from "@remix-run/react";
import { groupBy } from "lodash";
import { Fragment } from "react";

import { MatchCard } from "~/components/match-card/match-card";
import { db } from "~/utils/db.server";
import { getUserId } from "~/utils/session.server";

type MatchWithUserMatches = Prisma.MatchGetPayload<{
  select: {
    id: true;
    homeTeam: true;
    awayTeam: true;
    stage: true;
    group: true;
    playoff: true;
    stadium: true;
    startDate: true;
    userMatches: {
      include: { goalScorer: true };
    };
  };
}>;

type LoaderData = {
  matches: MatchWithUserMatches[];
};

const todayDate = new Date(new Date().setHours(0, 0, 0, 0)); // Today
const twoDaysLater = new Date(new Date().setHours(48, 59, 59, 999)); // 2 days after

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);

  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const matches = await db.match.findMany({
    where: {
      startDate: {
        lt: twoDaysLater,
        gt: todayDate,
      },
    },
    orderBy: { startDate: "asc" },
    select: {
      id: true,
      homeTeam: true,
      awayTeam: true,
      stage: true,
      group: true,
      playoff: true,
      stadium: true,
      startDate: true,
      userMatches: {
        where: { userId },
        include: { goalScorer: true },
      },
    },
  });

  return json({ matches });
};

export default function GameRoute() {
  const { matches } = useLoaderData<LoaderData>();

  const formattedMatches = matches.map((match) => ({
    ...match,
    groupByKey: new Date(match.startDate).toDateString(),
  }));

  const groupedMatches = groupBy(formattedMatches, "groupByKey");

  return (
    <div className="relative flex flex-col gap-6">
      {Object.entries(groupedMatches).map(([key, value], index) => {
        return (
          <Fragment key={key}>
            <h1 className="text-48-bold">
              {index === 0 ? "Today" : "Tomorrow"} Matches
            </h1>

            <div className="grid grid-cols-matches gap-4">
              {value.map((match) => {
                const { id, homeTeam, awayTeam, userMatches } = match;
                const stageTypeId = match.group?.id ?? match.playoff?.id;

                const { homeTeamScore, awayTeamScore, goalScorer } =
                  userMatches.find(
                    (userMatch) => userMatch.matchId === match.id
                  ) ?? {};

                const toMatch = `/game/${match.stage.id}-stage/${stageTypeId}/match-${match.id}`;

                return (
                  <MatchCard
                    key={id}
                    toMatch={toMatch}
                    match={match}
                    homeTeam={{
                      name: homeTeam?.name,
                      score: homeTeamScore,
                      flag: homeTeam?.flag,
                    }}
                    awayTeam={{
                      name: awayTeam?.name,
                      score: awayTeamScore,
                      flag: awayTeam?.flag,
                    }}
                    goalScorerName={goalScorer?.name}
                  />
                );
              })}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 401) {
    return (
      <div>
        <p>You must be logged in to play a game.</p>
        <Link to="/login">Login</Link>
      </div>
    );
  }
}
