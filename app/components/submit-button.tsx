import { useTransition } from "@remix-run/react";

export function SubmitButton() {
  const transition = useTransition();

  const text =
    transition.state === "submitting"
      ? "Saving..."
      : transition.state === "loading"
      ? transition.type === "actionRedirect"
        ? "Data saved, redirecting..."
        : "Loading..."
      : "Save";

  return (
    <button type="submit" className="action-button">
      {text}
    </button>
  );
}
