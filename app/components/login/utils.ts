import type { Transition } from "@remix-run/react/dist/transition";
import type { LoginPanelType } from "./types";

export function validateUsername(username: unknown) {
  if (
    typeof username !== "string" ||
    username.length < 3 ||
    username.length > 25
  ) {
    return `Usernames must be between 3 and 25 characters long`;
  }
}

export function validatePassword(password: unknown) {
  if (typeof password !== "string" || password.length < 6) {
    return `Passwords must be at least 6 characters long`;
  }
}

export function validateUrl(url: any) {
  let urls = ["/game", "/"];
  if (urls.includes(url)) {
    return url;
  }
  return "/game";
}

export const panelProperties = {
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
} as const;

export const getButtonLabel = ({
  transition,
  type,
}: {
  transition: Transition;
  type: LoginPanelType;
}) => {
  const { buttonLabel } = panelProperties[type];

  return transition.state === "submitting"
    ? buttonLabel.submitting
    : transition.type === "actionRedirect"
    ? buttonLabel.redirect
    : buttonLabel.text;
};
