import type { Prisma, UserRanking } from "@prisma/client";
import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Fragment } from "react";
import { UserRankingItem } from "~/components/UserRankingItem";

import { db } from "~/utils/db.server";
import { getUser } from "~/utils/session.server";

export const meta: MetaFunction = () => {
  return {
    title: "Ranking | FIFA World Cup Score Challenge",
    description: "Look at your ranking in FIFA World Cup Score Challenge!",
  };
};

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
      <h1 className="text-48-bold max-sm:text-30-bold">Ranking</h1>

      <ul className="flex flex-col gap-2 bg-white p-6 rounded-md">
        {users.map(({ id, username, ranking }, index) => (
          <Fragment key={id}>
            <li className="flex items-center justify-between">
              <span className="text-20-regular text-ellipsis overflow-hidden whitespace-nowrap">
                {username}
              </span>

              <div className="flex gap-12 max-md:gap-1 max-md:flex-col">
                <UserRankingItem title="Rank" value={ranking?.rank} />
                <UserRankingItem
                  title="Group pts"
                  value={ranking?.groupPoints}
                />
                <UserRankingItem
                  title="Playoff pts"
                  value={ranking?.playoffPoints}
                />
                <UserRankingItem
                  title="Total pts"
                  value={ranking?.totalPoints}
                />
              </div>
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
