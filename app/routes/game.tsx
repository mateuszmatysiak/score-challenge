import type { UserRanking } from "@prisma/client";
import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, Outlet, useCatch, useLoaderData } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { getUserId } from "~/utils/session.server";

type UserWithRanking = {
  rank: number;
  ranking: UserRanking | null;
  id: string;
  username: string;
  role: string;
};

type LoaderData = {
  user: UserWithRanking | undefined;
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);

  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const users = await db.user.findMany({
    orderBy: { ranking: { totalPoints: "desc" } },
    select: {
      id: true,
      username: true,
      ranking: true,
      role: true,
    },
  });

  const loggedInUser = users
    .map((user, index) => ({ ...user, rank: index + 1 }))
    .find((user) => user.id === userId);

  return json({ user: loggedInUser });
};

export default function GameRoute() {
  const { user } = useLoaderData<LoaderData>();

  const isAdmin = user?.role === "ADMIN";
  return (
    <div className="flex flex-col gap-10 min-h-screen bg-maroon px-32 py-8">
      <header>
        <div className="flex justify-between items-center gap-4 bg-orange text-white p-4 rounded-t-md">
          <h1 className="uppercase text-maroon font-bold">
            <div>Fifa World Cup Qatar 2022</div>
            <div className="text-sm">Score Challenge</div>
          </h1>

          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-maroon">Hi {user.username}</span>
              <Form action="/logout" method="post">
                <button
                  type="submit"
                  className="bg-bright-blue px-4 py-2 rounded-md border-b-4 border-solid border-maroon"
                >
                  Logout
                </button>
              </Form>
            </div>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </div>

        <div className="flex justify-between items-center bg-white p-4 rounded-b-md">
          <span className="text-lg">Your ranking</span>

          <div className="flex gap-8">
            <div className="flex flex-col items-center text-sm">
              <span>{user?.rank}</span>
              <span>Rank</span>
            </div>

            <div className="flex flex-col items-center text-sm">
              <span>{user?.ranking?.groupPoints ?? "-"}</span>
              <span>Group Pts</span>
            </div>

            <div className="flex flex-col items-center text-sm">
              <span>{user?.ranking?.playoffPoints ?? "-"}</span>
              <span>Playoff Pts</span>
            </div>

            <div className="flex flex-col items-center text-sm">
              <span>{user?.ranking?.totalPoints ?? "-"}</span>
              <span>Total Pts</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-col flex-1 gap-4">
        <div className="flex gap-4">
          <Link
            to="/game/group-stage"
            prefetch="intent"
            className="flex-1 bg-orange p-4 rounded-md border-b-4 border-solid border-bright-blue font-bold text-maroon"
          >
            Group Stage
          </Link>
          <Link
            to="/game/playoff-stage"
            prefetch="intent"
            className="flex-1 bg-orange p-4 rounded-md border-b-4 border-solid border-bright-blue font-bold text-maroon"
          >
            Playoff Stage
          </Link>
          <Link
            to="/game/ranking"
            prefetch="intent"
            className="flex-1 bg-orange p-4 rounded-md border-b-4 border-solid border-bright-blue font-bold text-maroon"
          >
            Ranking
          </Link>
          {isAdmin ? (
            <>
              <Link
                to="/game/admin/matches"
                prefetch="intent"
                className="flex-1 bg-orange p-4 rounded-md border-b-4 border-solid border-bright-blue font-bold text-maroon"
              >
                Admin Matches
              </Link>
              <Link
                to="/game/admin/playoff-pairs"
                prefetch="intent"
                className="flex-1 bg-orange p-4 rounded-md border-b-4 border-solid border-bright-blue font-bold text-maroon"
              >
                Admin Playoff Pairs
              </Link>
            </>
          ) : null}
        </div>

        <Outlet />
      </main>
    </div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 401) {
    return (
      <div>
        <p>You must be logged in to play a game.</p>
        <Link to="/login">Login</Link>
      </div>
    );
  }
}
