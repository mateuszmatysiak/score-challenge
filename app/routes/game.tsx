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
    orderBy: { ranking: { totalPoints: "asc" } },
    select: { id: true, username: true, ranking: true },
  });

  const loggedInUser = users
    .map((user, index) => ({ ...user, rank: index + 1 }))
    .find((user) => user.id === userId);

  return json({ user: loggedInUser });
};

export default function GameRoute() {
  const { user } = useLoaderData<LoaderData>();

  return (
    <div className="flex flex-col gap-10 min-h-screen bg-maroon px-32 py-8">
      <header>
        <div className="flex justify-between items-center gap-4 bg-orange text-white p-4 rounded-t-md">
          <h1 className="font-medium uppercase">Fifa World Cup Qatar 2022</h1>

          {user ? (
            <div className="flex items-center gap-4">
              <span>Hi {user.username}</span>
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
              <span>{user?.ranking?.groupPoints}</span>
              <span>Group Pts</span>
            </div>

            <div className="flex flex-col items-center text-sm">
              <span>{user?.ranking?.knockoutPoints}</span>
              <span>Knockout Pts</span>
            </div>

            <div className="flex flex-col items-center text-sm">
              <span>{user?.ranking?.totalPoints}</span>
              <span>Total Pts</span>
            </div>
          </div>
        </div>
      </header>

      <main>
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
