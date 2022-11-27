import type { MetaFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useCatch,
} from "@remix-run/react";
import styles from "./styles/app.css";

export function links() {
  return [{ rel: "stylesheet", href: styles }];
}

export const meta: MetaFunction = () => {
  const description = `Type your score at Fifa World Cup Qatar 2022`;
  return {
    charset: "utf-8",
    description,
    keywords: "Remix,World Cup, Qatar 2022,Score challenge, Game",
  };
};

function Document({
  children,
  title = `FIFA World Cup Score Challenge`,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <html lang="en">
      <head>
        <Meta />
        <title>{title}</title>
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <Document>
      <Outlet />
    </Document>
  );
}

export function CatchBoundary() {
  const caught = useCatch();

  return (
    <Document title={`${caught.status} ${caught.statusText}`}>
      <div className="bg-grey h-screen p-12">
        <h1 className="text-24-bold">
          {caught.status} {caught.statusText}
        </h1>
      </div>
    </Document>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <Document title="Error">
      <div className="bg-grey h-screen p-12">
        <h1 className="text-24-bold text-red-600">App Error</h1>
        <pre>{error.message}</pre>
      </div>
    </Document>
  );
}
