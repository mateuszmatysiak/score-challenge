import type { Prisma } from "@prisma/client";
import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
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
      title: "No playoff matches",
      description: "No playoff matches found",
    };
  }
  return {
    title: "Playoff Matches | FIFA World Cup Score Challenge",
    description: "Submit Playoff Matches in FIFA World Cup Score Challenge!",
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
        group: true;
        playoff: true;
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

interface LoaderData {
  userMatches: UserMatch[];
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const loggedInUser = await requireUser(request);

  const userMatches = await db.userMatch.findMany({
    where: { userId: loggedInUser.id, match: { playoffId: params.playoffId } },
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
          playoff: true,
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

export default function PlayoffMatchesRoute() {
  const { playoffId } = useParams();
  const { userMatches } = useLoaderData<LoaderData>();

  const playoffName = userMatches.find(
    (userMatch) => userMatch.match.playoff?.id === playoffId
  )?.match.playoff?.name;

  return (
    <div className="relative flex flex-col gap-6">
      <h1 className="text-48-bold max-sm:text-30-bold">
        {playoffName} Matches
      </h1>

      <div className="flex flex-wrap gap-4">
        {userMatches.map(({ id, ...userMatch }) => (
          <MatchCard key={id} values={userMatch} />
        ))}
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  const { playoffId } = useParams();
  return (
    <p className="text-20-medium">{`There was an error loading playoff matches by id ${playoffId}. Sorry.`}</p>
  );
}
