import type { Prisma } from "@prisma/client";
import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData, useParams } from "@remix-run/react";

import { db } from "~/utils/db.server";
import { getUserId } from "~/utils/session.server";

type UserMatch = Prisma.UserMatchGetPayload<{
  select: {
    id: true;
    homeTeamScore: true;
    awayTeamScore: true;
    match: {
      select: {
        id: true;
        group: { select: { id: true; name: true } };
        homeTeam: { select: { id: true; name: true } };
        awayTeam: { select: { id: true; name: true } };
        stadium: { select: { id: true; name: true } };
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
      match: {
        select: {
          id: true,
          group: { select: { id: true, name: true } },
          homeTeam: { select: { id: true, name: true } },
          awayTeam: { select: { id: true, name: true } },
          stadium: { select: { id: true, name: true } },
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

  const groupName = userMatches[0]?.match.group?.name;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-bright-blue p-4 rounded-md">
        <h1 className="text-white font-medium">Group {groupName} Matches</h1>
      </div>

      <ul className="flex flex-col gap-4">
        {userMatches.map((userMatch) => (
          <li
            key={userMatch.id}
            className="flex justify-between items-center p-4 bg-white rounded-md"
          >
            <div>
              <span>
                {userMatch.match.homeTeam?.name}{" "}
                {`(${userMatch.homeTeamScore ?? "-"})`}
              </span>
              -
              <span>
                {userMatch.match.awayTeam?.name}{" "}
                {`(${userMatch.awayTeamScore ?? "-"})`}
              </span>
              <div>{new Date(userMatch.match.startDate).toLocaleString()}</div>
            </div>

            <Link
              to={`/game/group-stage/${groupId}/match-${userMatch.match.id}`}
              prefetch="intent"
              className="bg-orange p-2 rounded-md border-b-4 border-solid border-maroon font-bold text-maroon"
            >
              Bet Match
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
