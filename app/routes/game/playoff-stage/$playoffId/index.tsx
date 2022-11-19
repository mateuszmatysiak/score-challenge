import type { Prisma } from "@prisma/client";
import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData, useParams } from "@remix-run/react";

import { db } from "~/utils/db.server";
import { getUser } from "~/utils/session.server";

type UserMatch = Prisma.UserMatchGetPayload<{
  select: {
    id: true;
    homeTeamScore: true;
    awayTeamScore: true;
    match: {
      select: {
        id: true;
        playoff: { select: { id: true; name: true } };
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
  const user = await getUser(request);

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  /* Pobieranie meczów użytkownika */

  const userMatches = await db.userMatch.findMany({
    where: { userId: user.id, match: { playoffId: params.playoffId } },
    orderBy: [{ match: { startDate: "asc" } }],
    select: {
      id: true,
      homeTeamScore: true,
      awayTeamScore: true,
      match: {
        select: {
          id: true,
          playoff: { select: { id: true, name: true } },
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

export default function PlayoffMatchesRoute() {
  const { playoffId } = useParams();
  const { userMatches } = useLoaderData<LoaderData>();

  const playoffName = userMatches[0]?.match.playoff?.name;

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-bright-blue p-4 rounded-md">
        <h1 className="text-white font-medium">{playoffName} Matches</h1>
      </div>

      <ul className="flex flex-col gap-4">
        {userMatches.map((userMatch) => (
          <li
            key={userMatch.id}
            className="flex justify-between items-center p-4 bg-white rounded-md"
          >
            <div>
              <span>
                {userMatch.match.homeTeam?.name ?? "Team A"}{" "}
                {`(${userMatch.homeTeamScore ?? "-"})`}
              </span>
              -
              <span>
                {userMatch.match.awayTeam?.name ?? "Team B"}{" "}
                {`(${userMatch.awayTeamScore ?? "-"})`}
              </span>
            </div>

            <Link
              to={`/game/playoff-stage/${playoffId}/match-${userMatch.match.id}`}
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
