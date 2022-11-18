import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { db } from "~/utils/db.server";
import { getUserId } from "~/utils/session.server";

type PlayoffWithMatches = {
  id: string;
  name: string;
  matches: {
    id: number;
    homeTeam: {
      name: string;
      score: number;
    };
    awayTeam: {
      name: string;
      score: number;
    };
  }[];
};

type LoaderData = {
  playoffs: PlayoffWithMatches[];
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);

  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  /* Pobieranie playoffów */

  const playoffs = await db.playoff.findMany({
    select: {
      id: true,
      name: true,
      matches: {
        orderBy: { startDate: "asc" },
        select: {
          id: true,
          userMatches: {
            where: { userId },
            select: {
              id: true,
              match: {
                select: {
                  homeTeam: { select: { id: true, name: true } },
                  awayTeam: { select: { id: true, name: true } },
                },
              },
              homeTeamScore: true,
              awayTeamScore: true,
            },
          },
        },
      },
    },
  });

  /* Formatowanie playoffów */

  const formattedPlayoffs = playoffs.map((playoff) => ({
    ...playoff,
    matches: playoff.matches.map(({ userMatches, ...match }) => ({
      ...match,
      homeTeam: {
        name: userMatches[0]?.match.homeTeam?.name,
        score: userMatches[0]?.homeTeamScore,
      },
      awayTeam: {
        name: userMatches[0]?.match.awayTeam?.name,
        score: userMatches[0]?.awayTeamScore,
      },
    })),
  }));

  return json({ playoffs: formattedPlayoffs });
};

export default function PlayoffStageRoute() {
  const { playoffs } = useLoaderData<LoaderData>();

  return (
    <div className="flex flex-col flex-1 gap-4">
      <div className="bg-bright-blue p-4 rounded-md">
        <h1 className="text-white font-medium">Playoff Stage</h1>
      </div>

      <div className="grid grid-cols-5 flex-1 gap-4">
        {playoffs.map((playoff) => (
          <div key={playoff.id} className="flex flex-col gap-4">
            <Link
              to={`/game/playoff-stage/${playoff.id}`}
              className="p-2 bg-orange text-white rounded-md border-b-4 border-solid border-bright-blue font-bold text-maroon"
            >
              {playoff.name}
            </Link>

            <div className="grid items-center flex-1 gap-4">
              {playoff.matches.map((match) => {
                return (
                  <div key={match.id} className="bg-white p-4 rounded-md">
                    {match.homeTeam.name ?? "Team A"} (
                    {match.homeTeam.score ?? "-"}){" "}
                    {match.awayTeam.name ?? "Team B"} (
                    {match.awayTeam.score ?? "-"})
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
