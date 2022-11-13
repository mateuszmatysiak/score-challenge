import type { Prisma } from "@prisma/client";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import qs from "qs";

import { db } from "~/utils/db.server";

type GroupWithMatches = Prisma.GroupGetPayload<{
  include: {
    matches: {
      select: {
        id: true;
        teamHome: true;
        teamAway: true;
      };
    };
  };
}>;

type LoaderData = {
  group: GroupWithMatches;
};

export const loader: LoaderFunction = async ({ params }) => {
  const group = await db.group.findUnique({
    where: {
      id: params.groupId,
    },
    select: {
      id: true,
      name: true,
      matches: {
        select: {
          id: true,
          teamHome: true,
          teamAway: true,
        },
      },
    },
  });

  return json({ group });
};

export const action: ActionFunction = async ({ request, params }) => {
  const text = await request.text();
  const { score } = qs.parse(text);

  console.log(score);

  return redirect("/game/group-stage");
};

export default function GroupMatchesRoute() {
  const { group } = useLoaderData<LoaderData>();

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-bright-blue p-4 rounded-md">
        <h1 className="text-white font-medium">Group {group.name} Matches</h1>
      </div>

      <ul>
        <Form method="post" className="flex flex-col gap-4">
          {group.matches.map((match, index) => (
            <li key={match.id} className="p-4 bg-white rounded-md">
              <label>
                {match.teamHome.name}
                <input
                  type="number"
                  name={`score[${index}][${match.teamHome.id}]`}
                  className="border border-maroon"
                />
              </label>
              -
              <label>
                {match.teamAway.name}
                <input
                  type="number"
                  name={`score[${index}][${match.teamAway.id}]`}
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
