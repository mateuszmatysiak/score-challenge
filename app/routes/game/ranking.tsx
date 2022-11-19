import type { Prisma } from "@prisma/client";
import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { db } from "~/utils/db.server";
import { getUser } from "~/utils/session.server";

type UserWithRanking = Prisma.UserGetPayload<{
  select: {
    id: true;
    username: true;
    ranking: true;
  };
}>;

interface LoaderData {
  users: (UserWithRanking & { isLoggedInUser: boolean })[];
}

export const loader: LoaderFunction = async ({ request }) => {
  const loggedInUser = await getUser(request);

  const users = await db.user.findMany({
    orderBy: { ranking: { totalPoints: "desc" } },
    select: { id: true, username: true, ranking: true },
  });

  const rankingUsers = users.map((u) => ({
    ...u,
    isLoggedInUser: u.id === loggedInUser?.id,
  }));

  return json({ users: rankingUsers });
};

export default function RankingRoute() {
  const { users } = useLoaderData<LoaderData>();

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-bright-blue p-4 rounded-md">
        <h1 className="text-white font-medium">Ranking</h1>
      </div>

      <ul className="flex flex-col gap-4">
        {users.map((user, index) => (
          <li
            key={user.id}
            className="flex justify-between items-center p-4 bg-white rounded-md"
          >
            <div>
              <span className={`${user.isLoggedInUser ? "text-blue-600" : ""}`}>
                {user.username}
              </span>
            </div>

            <div className="flex gap-8">
              <div className="flex flex-col items-center text-sm">
                <span>{index + 1}</span>
                <span>Rank</span>
              </div>

              <div className="flex flex-col items-center text-sm">
                <span>{user.ranking?.groupPoints ?? "-"}</span>
                <span>Group Pts</span>
              </div>

              <div className="flex flex-col items-center text-sm">
                <span>{user.ranking?.playoffPoints ?? "-"}</span>
                <span>Playoff Pts</span>
              </div>

              <div className="flex flex-col items-center text-sm">
                <span>{user.ranking?.totalPoints ?? "-"}</span>
                <span>Total Pts</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
