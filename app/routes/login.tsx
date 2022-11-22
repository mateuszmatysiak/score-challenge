import type { Match, Team } from "@prisma/client";
import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";

import { db } from "~/utils/db.server";
import { createUserSession, login, register } from "~/utils/session.server";

const seedUserTeams = ({
  userId,
  teams,
}: {
  userId: string;
  teams: Team[];
}) => {
  const userTeams: {
    userId: string;
    teamId: string;
    points: number;
    goalDifference: number;
  }[] = [];

  for (const team of teams) {
    userTeams.push({ userId, teamId: team.id, points: 0, goalDifference: 0 });
  }

  return userTeams;
};

const seedUserMatches = ({
  userId,
  matches,
}: {
  userId: string;
  matches: Match[];
}) => {
  const userMatches: { userId: string; matchId: number }[] = [];

  for (const match of matches) {
    userMatches.push({ userId, matchId: match.id });
  }

  return userMatches;
};

function validateUsername(username: unknown) {
  if (typeof username !== "string" || username.length < 3) {
    return `Usernames must be at least 3 characters long`;
  }
}

function validatePassword(password: unknown) {
  if (typeof password !== "string" || password.length < 6) {
    return `Passwords must be at least 6 characters long`;
  }
}

function validateUrl(url: any) {
  let urls = ["/game", "/"];
  if (urls.includes(url)) {
    return url;
  }
  return "/game";
}

type ActionData = {
  formError?: string;
  fieldErrors?: {
    username: string | undefined;
    password: string | undefined;
  };
  fields?: {
    loginType: string;
    username: string;
    password: string;
  };
};

const badRequest = (data: ActionData) => json(data, { status: 400 });

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();

  // const loginType = form.get("loginType");
  const loginType = "login";
  const username = form.get("username");
  const password = form.get("password");

  const redirectTo = validateUrl(form.get("redirectTo") || "/game");

  if (
    typeof loginType !== "string" ||
    typeof username !== "string" ||
    typeof password !== "string" ||
    typeof redirectTo !== "string"
  ) {
    return badRequest({
      formError: `Form not submitted correctly.`,
    });
  }

  const fields = { loginType, username, password };
  const fieldErrors = {
    username: validateUsername(username),
    password: validatePassword(password),
  };

  if (Object.values(fieldErrors).some(Boolean))
    return badRequest({ fieldErrors, fields });

  switch (loginType) {
    case "login": {
      const user = await login({ username, password });

      if (!user) {
        return badRequest({
          fields,
          formError: "Username/Password combination is incorrect",
        });
      }

      return createUserSession({ userId: user.id, redirectTo });
    }
    // case "register": {
    //   const userExists = await db.user.findFirst({
    //     where: { username },
    //   });
    //   if (userExists) {
    //     return badRequest({
    //       fields,
    //       formError: `User with username ${username} already exists`,
    //     });
    //   }

    //   const user = await register({ username, password });

    //   if (!user) {
    //     return badRequest({
    //       fields,
    //       formError: `Something went wrong trying to create a new user.`,
    //     });
    //   }

    //   /* Pobranie meczów i drużyn */

    //   const matches = await db.match.findMany();
    //   const teams = await db.team.findMany();

    //   /* Tworzenie meczów dla nowego użytkownika */

    //   const userMatches = seedUserMatches({ userId: user.id, matches });
    //   await db.userMatch.createMany({ data: userMatches });

    //   /* Tworzenie drużyn dla nowego użytkownika */

    //   const userTeams = seedUserTeams({ userId: user.id, teams });
    //   await db.userTeam.createMany({ data: userTeams });

    //   /* Tworzenie rankingu dla nowego użytkownika */

    //   await db.userRanking.create({
    //     data: {
    //       userId: user.id,
    //       groupPoints: 0,
    //       playoffPoints: 0,
    //       totalPoints: 0,
    //     },
    //   });

    //   return createUserSession({ userId: user.id, redirectTo });
    // }
    default: {
      return badRequest({
        fields,
        formError: `Login type invalid`,
      });
    }
  }
};

export default function LoginRoute() {
  const actionData = useActionData<ActionData>();
  const [searchParams] = useSearchParams();

  return (
    <main className="h-screen bg-[url(public/assets/images/background.jpg)] bg-cover bg-bottom">
      <div className="relative flex justify-center items-center bg-white-85-opacity w-[55%] h-full">
        <div className="absolute top-10 left-10 w-16 h-16 bg-[url(public/assets/images/logo.svg)]" />

        <div className="w-full max-w-[425px] bg-white p-10 rounded-lg">
          <h1 className="text-24-medium mb-9">Sign in to Your Account</h1>

          <Form method="post" className="flex flex-col gap-5">
            <input
              type="hidden"
              name="redirectTo"
              value={searchParams.get("redirectTo") ?? undefined}
            />

            <div className="flex flex-col gap-1">
              <label htmlFor="username-input" className="text-16-regular">
                Username
              </label>

              <input
                id="username-input"
                name="username"
                defaultValue={actionData?.fields?.username}
                aria-invalid={Boolean(actionData?.fieldErrors?.username)}
                aria-errormessage={
                  actionData?.fieldErrors?.username
                    ? "username-error"
                    : undefined
                }
                className="border border-grey rounded-md px-4 py-2"
              />

              {actionData?.fieldErrors?.username ? (
                <em
                  role="alert"
                  id="username-error"
                  className="text-xs text-red-700"
                >
                  {actionData.fieldErrors.username}
                </em>
              ) : null}
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="password-input" className="text-16-regular">
                Password
              </label>

              <input
                id="password-input"
                name="password"
                type="password"
                autoComplete="on"
                defaultValue={actionData?.fields?.password}
                aria-invalid={
                  Boolean(actionData?.fieldErrors?.password) || undefined
                }
                aria-errormessage={
                  actionData?.fieldErrors?.password
                    ? "password-error"
                    : undefined
                }
                className="border border-grey rounded-md px-4 py-2"
              />

              {actionData?.fieldErrors?.password ? (
                <em
                  role="alert"
                  id="password-error"
                  className="text-xs text-red-700"
                >
                  {actionData.fieldErrors.password}
                </em>
              ) : null}
            </div>

            <Link
              to="/register"
              className="text-14-regular ml-auto text-maroon"
            >
              Need an account?
            </Link>

            {actionData?.formError ? (
              <em
                id="form-error-message"
                role="alert"
                className="text-xs text-red-700"
              >
                {actionData.formError}
              </em>
            ) : null}

            <button type="submit" className="action-button w-full">
              Sign In
            </button>
          </Form>
        </div>
      </div>
    </main>
  );
}
