import type { Prisma } from "@prisma/client";
import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useCatch, useLoaderData } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { getUserId } from "~/utils/session.server";

type MatchWithUserMatches = Prisma.MatchGetPayload<{
  select: {
    id: true;
    homeTeam: { select: { name: true } };
    awayTeam: { select: { name: true } };
    stage: { select: { id: true } };
    groupId: true;
    playoffId: true;
    userMatches: {
      select: {
        id: true;
        homeTeamScore: true;
        awayTeamScore: true;
      };
    };
  };
}>;

type LoaderData = {
  matches: MatchWithUserMatches[];
};

const startCurrentDate = new Date(new Date().setHours(0, 0, 0, 0));
const endCurrentDate = new Date(new Date().setHours(23, 59, 59, 999));

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);

  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const matches = await db.match.findMany({
    where: {
      startDate: {
        lt: endCurrentDate,
        gt: startCurrentDate,
      },
    },
    select: {
      id: true,
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      stage: { select: { id: true } },
      groupId: true,
      playoffId: true,
      userMatches: {
        where: { userId },
        select: {
          id: true,
          homeTeamScore: true,
          awayTeamScore: true,
        },
      },
    },
  });

  return json({ matches });
};

export default function GameRoute() {
  const { matches } = useLoaderData<LoaderData>();

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-bright-blue p-4 rounded-md">
        <h1 className="text-white font-medium">Today Matches</h1>
      </div>

      <ul className="flex flex-col gap-4">
        {matches.map((match) => {
          const stageTypeId = match.groupId ?? match.playoffId;

          const to = `/game/${match.stage.id}-stage/${stageTypeId}/match-${match.id}`;
          return (
            <li
              key={match.id}
              className="flex justify-between items-center p-4 bg-white rounded-md"
            >
              <div>
                <span>
                  {match.homeTeam?.name}{" "}
                  {`(${match.userMatches[0]?.homeTeamScore ?? "-"})`}
                </span>
                -
                <span>
                  {match.awayTeam?.name}
                  {`(${match.userMatches[0]?.awayTeamScore ?? "-"})`}
                </span>{" "}
              </div>

              <Link
                to={to}
                prefetch="intent"
                className="bg-orange p-2 rounded-md border-b-4 border-solid border-maroon font-bold text-maroon"
              >
                Bet Match
              </Link>
            </li>
          );
        })}
      </ul>
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
