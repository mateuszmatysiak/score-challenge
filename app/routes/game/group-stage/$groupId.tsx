import type { Prisma } from "@prisma/client";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import qs from "qs";

import { db } from "~/utils/db.server";
import { getUserId } from "~/utils/session.server";

type UserMatchWithTeam = Prisma.UserMatchGetPayload<{
  select: {
    id: true;
    match: true;
    teamAway_score: true;
    teamHome_score: true;
  };
}>;

type LoaderData = {
  matches: UserMatchWithTeam[];
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await getUserId(request);

  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const userMatches = await db.userMatch.findMany({
    where: { userId, match: { groupName: params.groupId } },
    select: {
      id: true,
      match: true,
      teamAway_score: true,
      teamHome_score: true,
    },
  });

  return json({ matches: userMatches });
};

export const action: ActionFunction = async ({ request, params }) => {
  const userId = await getUserId(request);

  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const text = await request.text();
  const { score } = qs.parse(text);

  for (const s of [...(score as any)]) {
    if (s.teamHome_score && s.teamAway_score) {
      await db.userMatch.update({
        where: { id: Number(s.id) },
        data: {
          teamHome_score: Number(s.teamHome_score),
          teamAway_score: Number(s.teamAway_score),
        },
      });
    }
  }

  return redirect("/game/group-stage");
};

export default function GroupMatchesRoute() {
  const { matches } = useLoaderData<LoaderData>();

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-bright-blue p-4 rounded-md">
        <h1 className="text-white font-medium">Group A Matches</h1>
      </div>

      <ul>
        <Form method="post" className="flex flex-col gap-4">
          {matches.map((match, index) => (
            <li key={match.id} className="p-4 bg-white rounded-md">
              <input
                hidden
                name={`score[${index}][id]`}
                defaultValue={match.id ?? ""}
              />
              <label>
                {match.match.teamHome}
                <input
                  type="number"
                  name={`score[${index}][teamHome_score]`}
                  defaultValue={match.teamHome_score ?? ""}
                  className="border border-maroon"
                />
              </label>
              -
              <label>
                {match.match.teamAway}
                <input
                  type="number"
                  name={`score[${index}][teamAway_score]`}
                  defaultValue={match.teamAway_score ?? ""}
                  className="border border-maroon"
                />
              </label>
            </li>
          ))}

          <div className="ml-auto">
            <button
              type="submit"
              className="bg-orange p-4 rounded-md border-b-4 border-solid border-bright-blue font-bold text-maroon"
            >
              Save
            </button>
          </div>
        </Form>
      </ul>
    </div>
  );
}
