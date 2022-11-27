import type { Prisma, UserRanking } from "@prisma/client";
import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useCatch, useLoaderData } from "@remix-run/react";
import { NavList } from "~/components/navigation/nav-list";
import { UserRankingItem } from "~/components/user-ranking";

import { db } from "~/utils/db.server";
import { getUserId } from "~/utils/session.server";

type RankingWithRank = UserRanking & {
  rank: number;
};

export type UserWithRanking = Omit<User, "ranking"> & {
  ranking: RankingWithRank | null;
};

type User = Prisma.UserGetPayload<{
  select: { id: true; username: true; ranking: true; role: true };
}>;

type LoaderData = {
  user?: UserWithRanking;
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);

  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const users = await db.user.findMany({
    orderBy: { ranking: { totalPoints: "desc" } },
    select: { id: true, username: true, ranking: true, role: true },
  });

  const user = users
    .map((user, index) => ({
      ...user,
      ranking: { rank: index + 1, ...user.ranking },
    }))
    .find((user) => user.id === userId);

  return json({ user });
};

export default function GameRoute() {
  const { user } = useLoaderData<LoaderData>();

  return (
    <>
      <header className="fixed top-0 left-0 h-32 w-full flex flex-col z-10">
        <div className="flex justify-between items-center flex-1 bg-maroon text-white px-12">
          <Link
            to="/game"
            className="w-12 h-12 bg-[url(public/assets/images/logo.svg)] bg-contain bg-no-repeat bg-center"
          >
            <span hidden>Homepage</span>
          </Link>

          <NavList user={user} />
        </div>

        <div className="flex flex-1 justify-between items-center bg-white px-12">
          <span className="text-16-medium">Your ranking</span>

          <UserRankingItem userRanking={user?.ranking} />
        </div>
      </header>

      <main className="min-h-screen bg-grey pt-44 pb-12 px-12">
        <Outlet />
      </main>
    </>
  );
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 401) {
    return (
      <div className="bg-grey h-screen p-12">
        <p className="text-20-medium mb-4">
          You must be logged in to play a game.
        </p>
        <Link to="/login" className="action-button">
          Login
        </Link>
      </div>
    );
  }
}
