import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { db } from "~/utils/db.server";
import { getUserId } from "~/utils/session.server";

type LoaderData = {
  groups: { groupName: string; teams: string[] }[];
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);

  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const userMatches = await db.userMatch.findMany({
    where: { userId },
    select: {
      match: {
        select: {
          groupName: true,
          teamHome: true,
          teamAway: true,
        },
      },
      teamAway_score: true,
      teamHome_score: true,
    },
  });

  const groupsFromUserMatches = userMatches.map((userMatch) => ({
    groupName: userMatch.match.groupName,
    teams: [userMatch.match.teamHome, userMatch.match.teamAway],
  }));

  const mergedGroups: { groupName: string; teams: string[] }[] = Object.values(
    groupsFromUserMatches.reduce((initial: any, group) => {
      initial[group.groupName]
        ? initial[group.groupName].teams.push(...group.teams)
        : (initial[group.groupName] = { ...group });
      return initial;
    }, {})
  );

  const nonDuplicatesGroupes = mergedGroups.map(({ teams, groupName }) => ({
    groupName,
    teams: [...new Set(teams)],
  }));

  return json({ groups: nonDuplicatesGroupes });
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
          <li key={group.groupName}>
            <Link
              to={`/game/group-stage/${group.groupName}`}
              className="flex flex-col flex-1 gap-4 p-4 bg-white rounded-md"
            >
              <span className="font-medium text-maroon text-center">
                Group {group.groupName}
              </span>

              <ul className="flex flex-col gap-4">
                {group.teams.map((team, index) => (
                  <li
                    key={index}
                    className="flex gap-4 bg-orange px-4 py-3 rounded-md"
                  >
                    <span>-</span>
                    <span>{team}</span>
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
