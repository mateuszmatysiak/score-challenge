import type { Prisma, UserRanking } from "@prisma/client";
import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Fragment } from "react";
import { UserRankingItem } from "~/components/user-ranking";

import { db } from "~/utils/db.server";
import { getUser } from "~/utils/session.server";

type RankingWithRank = UserRanking & {
  rank: number;
  isLoggedInUser: boolean;
};

type UserWithRanking = Omit<User, "ranking"> & {
  ranking: RankingWithRank | null;
};

type User = Prisma.UserGetPayload<{
  select: { id: true; username: true; ranking: true };
}>;

interface LoaderData {
  users: UserWithRanking[];
}

export const loader: LoaderFunction = async ({ request }) => {
  const loggedInUser = await getUser(request);

  const users = await db.user.findMany({
    orderBy: { ranking: { totalPoints: "desc" } },
    select: { id: true, username: true, ranking: true },
  });

  const rankingUsers = users.map((user, index) => ({
    ...user,
    ranking: { rank: index + 1, ...user.ranking },
    isLoggedInUser: user.id === loggedInUser?.id,
  }));

  return json({ users: rankingUsers });
};

export default function RankingRoute() {
  const { users } = useLoaderData<LoaderData>();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-48-bold">Ranking</h1>

      <ul className="flex flex-col gap-2 bg-white p-6 rounded-md">
        {users.map((user, index) => (
          <Fragment key={user.id}>
            <li className="flex items-center justify-between">
              <span className="text-20-regular">{user.username}</span>

              <UserRankingItem userRanking={user.ranking} />
            </li>

            {index !== users.length - 1 ? <hr /> : null}
          </Fragment>
        ))}
      </ul>
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <p className="text-20-medium">{`There was an error loading users ranking. Sorry.`}</p>
  );
}
