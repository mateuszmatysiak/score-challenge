import { useTransition } from "@remix-run/react";

export function LoadingLabel() {
  const transition = useTransition();

  const text =
    transition.state === "loading"
      ? "Loading"
      : transition.state === "submitting"
      ? "Saving"
      : null;

  const bottom =
    transition.state === "loading" || transition.state === "submitting"
      ? "bottom-0"
      : "-bottom-full";

  return (
    <div
      className={`flex justify-center fixed ${bottom} left-0 right-0 mx-auto z-10 p-4 transition-all ease-out duration-700`}
    >
      <div className="flex gap-2 text-14-medium bg-white-85-opacity shadow-xl ring-1 ring-black ring-opacity-5 p-4 rounded-xl">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="currentColor"
          className="bi bi-arrow-repeat animate-spin"
          viewBox="0 0 16 16"
        >
          <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z" />
          <path
            fillRule="evenodd"
            d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"
          />
        </svg>

        {text}
      </div>
    </div>
  );
}
