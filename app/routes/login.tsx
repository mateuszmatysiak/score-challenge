import type { ActionFunction, MetaFunction } from "@remix-run/node";
import { LoginPanel } from "~/components/login-panel";
import { badRequest } from "~/utils/helpers/bad-request.server";
import {
  validatePassword,
  validateUrl,
  validateUsername,
} from "~/utils/helpers/login-panel";

import { createUserSession, login } from "~/utils/session.server";

export const meta: MetaFunction = () => {
  return {
    title: "Login | FIFA World Cup Score Challenge",
    description:
      "Login to submit your scores in FIFA World Cup Score Challenge!",
  };
};

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

  const user = await login({ username, password });

  if (!user) {
    return badRequest({
      fields,
      formError: "Username/Password combination is incorrect",
    });
  }

  return createUserSession({ userId: user.id, redirectTo });
};

export default function LoginRoute() {
  return <LoginPanel type="login" />;
}
