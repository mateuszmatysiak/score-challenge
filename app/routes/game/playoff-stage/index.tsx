import type { Prisma } from "@prisma/client";
import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { groupBy } from "lodash";
import { Fragment } from "react";
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
        playoff: true;
        group: true;
        homeTeam: true;
        awayTeam: true;
        stadium: true;
        stage: true;
        startDate: true;
      };
    };
  };
}>;

type LoaderData = {
  userMatches: UserMatch[];
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);

  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const userMatches = await db.userMatch.findMany({
    where: { userId, match: { stageId: "playoff" } },
    orderBy: [{ match: { startDate: "asc" } }],
    select: {
      id: true,
      homeTeamScore: true,
      awayTeamScore: true,
      goalScorer: true,
      match: {
        select: {
          id: true,
          playoff: true,
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

export default function GroupStageRoute() {
  const { userMatches } = useLoaderData<LoaderData>();

  const groupedUserMatches = groupBy(userMatches, "match.playoff.name");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-48-bold">Playoff Stage Matches</h1>

      {Object.entries(groupedUserMatches).map(([key, userMatches]) => {
        return (
          <Fragment key={key}>
            <h2 className="text-24-medium">{key} Matches</h2>

            <div className="grid grid-cols-matches gap-4">
              {userMatches.map(({ id, ...userMatch }) => (
                <MatchCard key={id} {...userMatch} />
              ))}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
