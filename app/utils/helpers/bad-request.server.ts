import { json } from "@remix-run/node";

export const badRequest = (data: unknown) => json(data, { status: 400 });
