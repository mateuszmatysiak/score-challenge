import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { db } from "~/utils/db.server";
import { getUserId } from "~/utils/session.server";

type GroupsWithTeams = {
  id: string;
  name: string;
  teams: {
    name: string;
    points: number;
    goalDifference: number;
  }[];
};

type LoaderData = {
  groups: GroupsWithTeams[];
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);

  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  /* Pobieranie group */

  const groups = await db.group.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      teams: {
        select: {
          name: true,
          userTeams: {
            where: { userId },
          },
        },
      },
    },
  });

  /* Formatowanie grup */

  const formattedGroups = groups.map(({ teams, ...group }) => ({
    ...group,
    teams: teams.map(({ userTeams, ...team }) => ({
      ...team,
      points: userTeams[0]?.points,
      goalDifference: userTeams[0]?.goalDifference,
    })),
  }));

  /* Sortowanie grup po zdobytych punktach i różnicy bramek */

  const sortedGroups = formattedGroups.map((group) => ({
    ...group,
    teams: group.teams.sort(
      (a, b) => b.points - a.points || b.goalDifference - a.goalDifference
    ),
  }));

  return json({ groups: sortedGroups });
};

export default function GroupStageRoute() {
  const { groups } = useLoaderData<LoaderData>();

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-bright-blue p-4 rounded-md">
        <h1 className="text-white font-medium">Group Stage</h1>
      </div>

      <ul className="grid grid-cols-4 gap-4">
        {groups.map((group) => (
          <li
            key={group.id}
            className="flex flex-col flex-1 gap-4 p-4 bg-white rounded-md"
          >
            <span className="font-medium text-maroon text-center">
              Group {group.name}
            </span>

            <ul className="flex flex-col gap-4">
              {group.teams.map((team, index) => {
                const backgroundColor =
                  index <= 1 ? "bg-orange" : "bg-amber-200";
                return (
                  <li
                    key={index}
                    className={`flex gap-4 justify-between ${backgroundColor} px-4 py-3 rounded-md`}
                  >
                    <div className="flex gap-4">
                      <span>{index + 1}</span>
                      <span>{team.name}</span>
                    </div>

                    <div className="flex gap-4">
                      <span>{team.points}</span>
                      <span>{team.goalDifference}</span>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="flex justify-center">
              <Link
                to={`/game/group-stage/${group.id}`}
                className="bg-orange p-2 rounded-md border-b-4 border-solid border-maroon font-bold text-maroon"
              >
                Bet Group
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
