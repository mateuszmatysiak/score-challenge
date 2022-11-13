import type { User } from "@prisma/client";
import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { db } from "~/utils/db.server";
import { getUser } from "~/utils/session.server";

interface RankingUser extends Pick<User, "id" | "username"> {
  isLoggedInUser: boolean;
}

interface LoaderData {
  users: RankingUser[];
}

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUser(request);

  const users = await db.user.findMany({
    select: { id: true, username: true },
  });

  const rankingUsers = users.map((u) => ({
    ...u,
    isLoggedInUser: u.id === user?.id,
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
        {users.map((user) => (
          <li
            key={user.id}
            className="flex justify-between items-center p-4 bg-white rounded-md"
          >
            <span>{user.username}</span>

            <div className="flex gap-8">
              <div className="flex flex-col items-center text-sm">
                <span>-</span>
                <span>Rank</span>
              </div>

              <div className="flex flex-col items-center text-sm">
                <span>-</span>
                <span>Group Pts</span>
              </div>

              <div className="flex flex-col items-center text-sm">
                <span>-</span>
                <span>Knockout Pts</span>
              </div>

              <div className="flex flex-col items-center text-sm">
                <span>-</span>
                <span>Total Pts</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
