import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  useCatch,
  useLoaderData,
} from "@remix-run/react";
import { getEnv } from "./env.server";
import styles from "./styles/app.css";

export function links() {
  return [{ rel: "stylesheet", href: styles }];
}

export const meta: MetaFunction = () => {
  const description = `Type your score at Fifa World Cup Qatar 2022`;
  return {
    charset: "utf-8",
    description,
    keywords: "Remix,World Cup, Qatar 2022,Score challange, Game",
  };
};

type LoaderData = {
  ENV: ReturnType<typeof getEnv>;
};

export const loader: LoaderFunction = async ({ request }) => {
  return json<LoaderData>({
    ENV: getEnv(),
  });
};

function Document({
  children,
  title = `FIFA World Cup Score Challange`,
  data,
}: {
  children: React.ReactNode;
  title?: string;
  data?: LoaderData;
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
        <Scripts />
        {data ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.ENV = ${JSON.stringify(data.ENV)}`,
            }}
          />
        ) : null}
        <LiveReload />
      </body>
    </html>
  );
}

export default function App() {
  const data = useLoaderData<LoaderData>();

  return (
    <Document data={data}>
      <Outlet />
    </Document>
  );
}

export function CatchBoundary() {
  const caught = useCatch();

  return (
    <Document title={`${caught.status} ${caught.statusText}`}>
      <div>
        <h1>
          {caught.status} {caught.statusText}
        </h1>
      </div>
    </Document>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <Document title="Error">
      <div>
        <h1>App Error</h1>
        <pre>{error.message}</pre>
      </div>
    </Document>
  );
}
