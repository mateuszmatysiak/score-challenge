import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, Outlet, useCatch, useLoaderData } from "@remix-run/react";
import { getUser } from "~/utils/session.server";

type LoaderData = {
  user: Awaited<ReturnType<typeof getUser>>;
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUser(request);

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const data: LoaderData = { user };

  return json(data);
};

export default function GameRoute() {
  const data = useLoaderData<LoaderData>();

  return (
    <div className="flex flex-col gap-10 min-h-screen bg-maroon px-32 py-8">
      <header>
        <div className="flex justify-between items-center gap-4 bg-orange text-white p-4 rounded-t-md">
          <h1 className="font-medium uppercase">Fifa World Cup Qatar 2022</h1>

          {data.user ? (
            <div className="flex items-center gap-4">
              <span>Hi {data.user.username}</span>
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
