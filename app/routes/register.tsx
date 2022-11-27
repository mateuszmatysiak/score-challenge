import type { Match } from "@prisma/client";
import type { ActionFunction } from "@remix-run/node";
import { LoginPanel } from "~/components/login-panel";
import { badRequest } from "~/utils/bad-request";

import { db } from "~/utils/db.server";
import {
  validatePassword,
  validateUrl,
  validateUsername,
} from "~/utils/login-panel";
import { createUserSession, register } from "~/utils/session.server";

type SeedUserMatchesArgs = { userId: string; matches: Match[] };

const seedUserMatches = ({ userId, matches }: SeedUserMatchesArgs) => {
  const userMatches: { userId: string; matchId: number }[] = [];

  for (const match of matches) {
    userMatches.push({ userId, matchId: match.id });
  }

  return userMatches;
};

const userRankingPoints = { groupPoints: 0, playoffPoints: 0, totalPoints: 0 };

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();

  const username = form.get("username");
  const password = form.get("password");

  const redirectTo = validateUrl(form.get("redirectTo") || "/game");

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    typeof redirectTo !== "string"
  ) {
    return badRequest({ formError: `Form not submitted correctly.` });
  }

  const fields = { username, password };
  const fieldErrors = {
    username: validateUsername(username),
    password: validatePassword(password),
  };

  if (Object.values(fieldErrors).some(Boolean))
    return badRequest({ fieldErrors, fields });

  const userExists = await db.user.findFirst({ where: { username } });
  if (userExists) {
    return badRequest({
      fields,
      formError: `User with username ${username} already exists`,
    });
  }

  const user = await register({ username, password });

  if (!user) {
    return badRequest({
      fields,
      formError: `Something went wrong trying to create a new user.`,
    });
  }

  /* Pobranie meczów */

  const matches = await db.match.findMany();

  /* Tworzenie meczów dla nowego użytkownika */

  const userMatches = seedUserMatches({ userId: user.id, matches });
  await db.userMatch.createMany({ data: userMatches });

  /* Tworzenie rankingu dla nowego użytkownika */

  await db.userRanking.create({
    data: { userId: user.id, ...userRankingPoints },
  });

  return createUserSession({ userId: user.id, redirectTo });
};

export default function RegisterRoute() {
  return <LoginPanel type="register" />;
}
