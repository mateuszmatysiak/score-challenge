import type { Prisma, UserRanking } from "@prisma/client";
import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Link,
  Outlet,
  useCatch,
  useLoaderData,
  useLocation,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import { CloseIcon } from "~/components/icons/close-icon";
import { MenuIcon } from "~/components/icons/menu-icon";
import { NavList } from "~/components/navigation/nav-list";
import { UserRankingItem } from "~/components/user-ranking";

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
  const location = useLocation();
  const { userWithRanking } = useLoaderData<LoaderData>();

  const [isOpenMobileNavi, setIsOpenMobileNavi] = useState(false);

  useEffect(() => {
    setIsOpenMobileNavi(false);
  }, [location.key]);

  return (
    <>
      <header className="fixed top-0 left-0 h-32 w-full flex flex-col z-10">
        <div className="flex justify-between items-center flex-1 bg-maroon text-white px-12 max-xl:px-8 max-sm:px-4">
          <Link
            to="/game"
            prefetch="intent"
            className="min-w-[3rem] min-h-[3rem] bg-[url(public/assets/images/logo.svg)] bg-contain bg-no-repeat bg-center"
          >
            <span className="sr-only">Home Navigation</span>
          </Link>

          <NavList type="desktop" user={userWithRanking} />

          <button
            className="hidden max-xl:block p-3 -mr-3"
            onClick={() => setIsOpenMobileNavi(true)}
          >
            <span className="sr-only">Open mobile menu</span>
            <MenuIcon />
          </button>

          {isOpenMobileNavi ? (
            <div className="fixed inset-0">
              <div className="w-full h-full bg-maroon">
                <div className="flex justify-between items-center h-16 max-xl:px-8 max-sm:px-4">
                  <div className="flex flex-col">
                    <span className="text-12-regular">Account Name</span>
                    <span className="whitespace-nowrap text-ellipsis overflow-hidden">
                      {userWithRanking?.username}
                    </span>
                  </div>
                  <button
                    className="p-4 -mr-4"
                    onClick={() => setIsOpenMobileNavi(false)}
                  >
                    <span className="sr-only">Close mobile menu</span>
                    <CloseIcon />
                  </button>
                </div>

                <NavList type="mobile" user={userWithRanking} />
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex justify-between items-center flex-1 gap-2 bg-white px-12 max-xl:px-8 max-sm:px-4">
          <span className="text-16-medium whitespace-nowrap">Your ranking</span>

          <div className="flex gap-8 text-center">
            <UserRankingItem
              title="Rank"
              value={userWithRanking?.ranking?.rank}
            />
            <UserRankingItem
              title="Group pts"
              value={userWithRanking?.ranking?.groupPoints}
              className="max-sm:hidden"
            />
            <UserRankingItem
              title="Playoff pts"
              value={userWithRanking?.ranking?.playoffPoints}
              className="max-sm:hidden"
            />
            <UserRankingItem
              title="Total pts"
              value={userWithRanking?.ranking?.totalPoints}
            />
          </div>
        </div>
      </header>

      <main className="min-h-screen bg-grey pt-44 pb-12 px-12 max-xl:px-8 max-sm:px-4 max-xl:pt-40 max-sm:pt-40 max-xl:pb-8 max-sm:pb-4">
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
