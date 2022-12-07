import {
  Form,
  Link,
  useActionData,
  useSearchParams,
  useTransition,
} from "@remix-run/react";
import type { ActionData } from "~/types/login-panel";

export interface LoginPanelProps {
  type: "login" | "register";
}

const panelProperties = {
  login: {
    panelLabel: "Sign in to Your Account",
    buttonLabel: {
      text: "Sign In",
      submitting: "Logging in...",
      redirect: "Logging in...",
    },
    switchProperties: {
      label: "Need an account?",
      to: "/register",
    },
  },
  register: {
    panelLabel: "Sign up for an Account",
    buttonLabel: {
      text: "Create account",
      submitting: "Creating...",
      redirect: "Logging in...",
    },
    switchProperties: {
      label: "Have an account?",
      to: "/login",
    },
  },
};

export function LoginPanel({ type }: LoginPanelProps) {
  const actionData = useActionData<ActionData>();
  const [searchParams] = useSearchParams();
  const transition = useTransition();

  const { panelLabel, buttonLabel, switchProperties } = panelProperties[type];

  const text =
    transition.state === "submitting"
      ? buttonLabel.submitting
      : transition.type === "actionRedirect"
      ? buttonLabel.redirect
      : buttonLabel.text;

  return (
    <main className="h-screen bg-cover bg-bottom">
      <div className="relative flex justify-center items-center bg-gray-50 w-full h-full">
        <div className="w-full max-w-[425px] bg-white p-10 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
          <h1 className="text-24-medium mb-9">{panelLabel}</h1>

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
              to={switchProperties.to}
              className="text-14-regular ml-auto text-maroon"
            >
              {switchProperties.label}
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
              {text}
            </button>
          </Form>
        </div>
      </div>
    </main>
  );
}
