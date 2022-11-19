import invariant from "tiny-invariant";

export function getEnv() {
  invariant(process.env.ADMIN_USERNAME, "ADMIN_USERNAME should be defined.");

  return {
    ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  };
}

type ENV = ReturnType<typeof getEnv>;

declare global {
  var ENV: ENV;
  interface Window {
    ENV: ENV;
  }
}
