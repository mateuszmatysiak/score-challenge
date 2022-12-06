import type { Prisma } from "@prisma/client";
import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import { MatchCard } from "~/components/match-card";

import { db } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";

export const meta: MetaFunction = ({
  data,
}: {
  data: LoaderData | undefined;
}) => {
  if (!data) {
    return {
      title: "No group matches",
      description: "No group matches found",
    };
  }
  return {
    title: "Group Matches | FIFA World Cup Score Challenge",
    description: "Submit Group Matches in FIFA World Cup Score Challenge!",
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

  /* Pobieranie meczów użytkownika */

  const userMatches = await db.userMatch.findMany({
    where: { userId: loggedInUser.id, match: { groupId: params.groupId } },
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
          tournamentMatches: true,
        },
      },
    },
  });

  return json({ userMatches });
};

export default function GroupMatchesRoute() {
  const { groupId } = useParams();
  const { userMatches } = useLoaderData<LoaderData>();

  const groupName = userMatches.find(
    (userMatch) => userMatch.match.group?.id === groupId
  )?.match.group?.name;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-48-bold max-sm:text-30-bold">
        Group {groupName} Matches
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
  const { groupId } = useParams();
  return (
    <p className="text-20-medium">{`There was an error loading group matches by id ${groupId}. Sorry.`}</p>
  );
}
