import type { Prisma } from "@prisma/client";
import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import { MatchCard } from "~/components/match-card/match-card";

import { db } from "~/utils/db.server";
import { getUserId } from "~/utils/session.server";

type UserMatch = Prisma.UserMatchGetPayload<{
  select: {
    id: true;
    homeTeamScore: true;
    awayTeamScore: true;
    goalScorer: true;
    match: {
      select: {
        id: true;
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
  userMatches: UserMatch[];
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await getUserId(request);

  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  /* Pobieranie meczów użytkownika */

  const userMatches = await db.userMatch.findMany({
    where: { userId, match: { groupId: params.groupId } },
    orderBy: [{ match: { startDate: "asc" } }],
    select: {
      id: true,
      homeTeamScore: true,
      awayTeamScore: true,
      goalScorer: true,
      match: {
        select: {
          id: true,
          group: true,
          homeTeam: true,
          awayTeam: true,
          stadium: true,
          stage: true,
          startDate: true,
        },
      },
    },
  });

  return json({ userMatches });
};

export default function GroupMatchesRoute() {
  const { groupId } = useParams();
  const { userMatches } = useLoaderData<LoaderData>();

  const groupName = groupId?.split("-")[1].toUpperCase();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-48-bold">Group {groupName} Matches</h1>

      <div className="grid grid-cols-matches gap-4">
        {userMatches.map(
          ({ match, goalScorer, homeTeamScore, awayTeamScore }) => {
            const { id, group, homeTeam, awayTeam } = match;

            const toMatch = `/game/group-stage/${group?.id}/match-${id}`;

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
          }
        )}
      </div>
    </div>
  );
}
