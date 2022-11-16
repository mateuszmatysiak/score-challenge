import type { ActionFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useActionData, useSearchParams } from "@remix-run/react";

import { db } from "~/utils/db.server";
import { createUserSession, login, register } from "~/utils/session.server";

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

  const loginType = form.get("loginType");
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
    case "register": {
      const userExists = await db.user.findFirst({
        where: { username },
      });
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

      /* Pobranie meczów i drużyn */

      const matches = await db.match.findMany();
      const teams = await db.team.findMany();

      /* Tworzenie meczów dla nowego użytkownika */

      /* TODO: Zamienić pętle for na seedFunctions */

      for (const match of matches) {
        await db.userMatch.createMany({
          data: { userId: user.id, matchId: match.id },
        });
      }

      /* Tworzenie drużyn dla nowego użytkownika */

      /* TODO: Zamienić pętle for na seedFunctions */

      for (const team of teams) {
        await db.userTeam.createMany({
          data: {
            userId: user.id,
            teamId: team.id,
            points: 0,
            goalDifference: 0,
          },
        });
      }

      /* Tworzenie rankingu dla nowego użytkownika */

      /* TODO: Zamienić pętle for na seedFunctions */

      await db.userRanking.create({
        data: {
          userId: user.id,
          groupPoints: 0,
          knockoutPoints: 0,
          totalPoints: 0,
        },
      });

      return createUserSession({ userId: user.id, redirectTo });
    }
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
    <main className="h-screen flex justify-center items-center bg-maroon p-6">
      <div className="flex flex-col gap-4 px-4 py-8 bg-white rounded-xl max-w-[450px] w-full">
        <h1 className="text-3xl text-maroon font-medium text-center">
          Fifa World Cup Qatar 2022
        </h1>
        <Form method="post" className="flex flex-col gap-4">
          <input
            type="hidden"
            name="redirectTo"
            value={searchParams.get("redirectTo") ?? undefined}
          />

          <fieldset className="flex justify-center gap-8">
            <label className="flex gap-2">
              <input
                type="radio"
                name="loginType"
                value="login"
                defaultChecked={
                  !actionData?.fields?.loginType ||
                  actionData?.fields?.loginType === "login"
                }
              />
              Login
            </label>

            <label className="flex gap-2">
              <input
                type="radio"
                name="loginType"
                value="register"
                defaultChecked={actionData?.fields?.loginType === "register"}
              />
              Register
            </label>
          </fieldset>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="username-input"
              className="text-sm font-medium text-maroon"
            >
              Username
            </label>
            <input
              type="text"
              id="username-input"
              name="username"
              defaultValue={actionData?.fields?.username}
              className="bg-grey px-4 py-2 border border-solid border-maroon rounded-md"
              aria-invalid={Boolean(actionData?.fieldErrors?.username)}
              aria-errormessage={
                actionData?.fieldErrors?.username ? "username-error" : undefined
              }
            />
            {actionData?.fieldErrors?.username ? (
              <p
                role="alert"
                id="username-error"
                className="text-xs text-red-700"
              >
                {actionData.fieldErrors.username}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="password-input"
              className="text-sm font-medium text-maroon"
            >
              Password
            </label>
            <input
              id="password-input"
              name="password"
              type="password"
              defaultValue={actionData?.fields?.password}
              className="bg-grey px-4 py-2 border border-solid border-maroon rounded-md"
              aria-invalid={
                Boolean(actionData?.fieldErrors?.password) || undefined
              }
              aria-errormessage={
                actionData?.fieldErrors?.password ? "password-error" : undefined
              }
            />
            {actionData?.fieldErrors?.password ? (
              <p
                role="alert"
                id="password-error"
                className="text-xs text-red-700"
              >
                {actionData.fieldErrors.password}
              </p>
            ) : null}
          </div>

          <div id="form-error-message">
            {actionData?.formError ? (
              <p role="alert" className="text-xs text-red-700">
                {actionData.formError}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            className="bg-orange p-2 rounded-md border-b-4 border-solid border-maroon font-bold text-maroon"
          >
            Submit
          </button>
        </Form>
      </div>
    </main>
  );
}
