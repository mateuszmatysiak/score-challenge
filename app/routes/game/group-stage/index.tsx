import type { Group, Team } from "@prisma/client";
import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { db } from "~/utils/db.server";
import { getUserId } from "~/utils/session.server";

// type GroupWithMatches = Prisma.GroupGetPayload<{
//   include: { matches: true };
// }>;

type GroupWithTeams = { teams: Team[] } & Group;

type LoaderData = {
  groups: GroupWithTeams[];
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);

  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const groups = await db.group.findMany({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      matches: {
        select: {
          teamHome: true,
          teamAway: true,
        },
      },
    },
  });

  const groupsWithTeams = groups
    .map(({ matches, ...group }) => {
      const uniqueIds: string[] = [];
      return {
        ...group,
        teams: matches
          .map((match) => match.teamAway)
          .filter((team) => {
            const isDuplicate = uniqueIds.includes(team.id);

            if (!isDuplicate) {
              uniqueIds.push(team.id);

              return true;
            }

            return false;
          }),
      };
    })
    .sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });

  return json({ groups: groupsWithTeams });
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
          <li key={group.id}>
            <Link
              to={`/game/group-stage/${group.id}`}
              className="flex flex-col flex-1 gap-4 p-4 bg-white rounded-md"
            >
              <span className="font-medium text-maroon text-center">
                Group {group.name}
              </span>

              <ul className="flex flex-col gap-4">
                {group.teams.map((team) => (
                  <li
                    key={team.id}
                    className="flex gap-4 bg-orange px-4 py-3 rounded-md"
                  >
                    <span>-</span>
                    <span>{team.name}</span>
                  </li>
                ))}
              </ul>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
