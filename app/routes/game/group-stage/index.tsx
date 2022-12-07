import type { Prisma } from "@prisma/client";
import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { groupBy } from "lodash";
import { Fragment } from "react";
import { MatchCard } from "~/components/MatchCard";

import { db } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";

export const meta: MetaFunction = () => {
  return {
    title: "Group Stage Matches | FIFA World Cup Score Challenge",
    description:
      "Submit Group Stage Matches in FIFA World Cup Score Challenge!",
  };
};

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
        tournamentMatches: true;
      };
    };
  };
}>;

type LoaderData = {
  userMatches: UserMatch[];
};

export const loader: LoaderFunction = async ({ request }) => {
  const loggedInUser = await requireUser(request);

  const userMatches = await db.userMatch.findMany({
    where: { userId: loggedInUser.id, match: { stageId: "group" } },
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
          tournamentMatches: true,
        },
      },
    },
  });

  return json({ userMatches });
};

export default function GroupStageRoute() {
  const { userMatches } = useLoaderData<LoaderData>();

  const groupedUserMatches = groupBy(userMatches, "match.group.name");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-48-bold max-sm:text-30-bold">Group Stage Matches</h1>

      {Object.entries(groupedUserMatches).map(([key, userMatches]) => {
        return (
          <Fragment key={key}>
            <p className="text-24-medium">Group {key} Matches</p>

            <div className="flex flex-wrap gap-4">
              {userMatches.map(({ id, ...userMatch }) => (
                <MatchCard key={id} values={userMatch} />
              ))}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <p className="text-20-medium">{`There was an error loading all group matches. Sorry.`}</p>
  );
}
