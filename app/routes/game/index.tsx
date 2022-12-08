import type { Prisma } from "@prisma/client";
import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { groupBy, isEmpty } from "lodash";
import { Fragment } from "react";
import { MatchCard } from "~/components/MatchCard";

import { db } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";

export const meta: MetaFunction = ({
  data,
}: {
  data: LoaderData | undefined;
}) => {
  if (!data) {
    return {
      title: "No matches",
      description: "No matches found",
    };
  }
  return {
    title: "Today's and tomorrow's matches | FIFA World Cup Score Challenge",
    description: "Submit your today's and tomorrow's matches",
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

const todayDate = new Date(new Date().setHours(0, 0, 0, 0)); // Today
const twoDaysLater = new Date(new Date().setHours(48, 59, 59, 999)); // 2 days after

export const loader: LoaderFunction = async ({ request }) => {
  const loggedInUser = await requireUser(request);

  const userMatches = await db.userMatch.findMany({
    where: {
      userId: loggedInUser.id,
      match: { startDate: { lt: twoDaysLater, gt: todayDate } },
    },
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

export default function GameRoute() {
  const { userMatches } = useLoaderData<LoaderData>();

  const formattedMatches = userMatches.map((userMatch) => {
    const todayDate = new Date().toLocaleDateString();
    const matchDate = new Date(userMatch.match.startDate).toLocaleDateString();

    return {
      ...userMatch,
      groupedByKey: todayDate === matchDate ? "today" : "tomorrow",
    };
  });

  const groupedUserMatches = groupBy(formattedMatches, "groupedByKey");

  return (
    <div className="relative flex flex-col gap-6">
      {isEmpty(groupedUserMatches) ? (
        <div className="bg-white p-6 text-center rounded-md text-18-regular">
          No matches to bet
        </div>
      ) : (
        Object.entries(groupedUserMatches).map(([key, userMatches], index) => {
          return (
            <Fragment key={key}>
              <span className="text-48-bold max-sm:text-30-bold capitalize">
                {key}'s Matches
              </span>

              <div className="flex flex-wrap gap-4">
                {userMatches.map(({ id, ...userMatch }) => (
                  <MatchCard key={id} values={userMatch} />
                ))}
              </div>
            </Fragment>
          );
        })
      )}
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <p className="text-20-medium">{`There was an error loading today's and tomorrow's matches. Sorry.`}</p>
  );
}
