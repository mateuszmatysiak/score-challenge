import type { Prisma, UserRanking } from "@prisma/client";
import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useCatch, useLoaderData } from "@remix-run/react";
import { GameRules } from "~/components/GameRules";
import { LoggedInUserRanking } from "~/components/LoggedInUserRanking";
import { LogoLink } from "~/components/LogoLink";
import { MobileMenu } from "~/components/MobileMenu";
import { NavList } from "~/components/NavigationList";

import { db } from "~/utils/db.server";
import { requireUser } from "~/utils/session.server";

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
  userWithRanking?: UserWithRanking;
};

export const loader: LoaderFunction = async ({ request }) => {
  const loggedInUser = await requireUser(request);

  const users = await db.user.findMany({
    orderBy: { ranking: { totalPoints: "desc" } },
    select: { id: true, username: true, ranking: true, role: true },
  });

  const userWithRanking = users
    .map((user, index) => ({
      ...user,
      ranking: { rank: index + 1, ...user.ranking },
    }))
    .find((user) => user.id === loggedInUser.id);

  return json({ userWithRanking });
};

export default function GameRoute() {
  const { userWithRanking } = useLoaderData<LoaderData>();

  const { ranking, username } = userWithRanking ?? {};
  const { rank, groupPoints, playoffPoints, totalPoints } = ranking ?? {};

  return (
    <>
      <header className="fixed top-0 left-0 h-32 w-full flex flex-col z-10 shadow-lg">
        <div className="flex justify-between items-center flex-1 bg-maroon text-white px-12 max-xl:px-8 max-sm:px-4">
          <LogoLink />

          <NavList type="desktop" username={username} />

          <MobileMenu username={username} />
        </div>

        <LoggedInUserRanking
          rank={rank}
          groupPoints={groupPoints}
          playoffPoints={playoffPoints}
          totalPoints={totalPoints}
        />
      </header>

      <main className="min-h-screen bg-grey pt-44 pb-12 px-12 max-xl:px-8 max-sm:px-4 max-xl:pt-40 max-sm:pt-40 max-xl:pb-8 max-sm:pb-4">
        <GameRules />

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
