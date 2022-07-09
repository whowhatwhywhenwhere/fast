import type { Context } from "./context.ts";

export type ResponseLike =
  | Response
  | ReadableStream
  | ArrayBuffer
  | Uint8Array
  | string
  | Blob
  | File
  | Record<string, unknown>
  | Array<unknown>
  | null
  | void;

export type Middleware = (
  ctx: Context,
  next: NextFunction,
) => Promise<ResponseLike> | ResponseLike;

export type NextFunction = (
  ctx: Context,
) => Promise<Response>;

export function compose(middlewares: Middleware[]) {
  let cur = -1;
  const max = middlewares.length;
  let next: NextFunction;
  return next = async (ctx: Context) => {
    // fallback next() called on last handler
    if (++cur >= max) return new Response("Not Found", { status: 404 });
    const res = await middlewares[cur](ctx, next);
    if (res instanceof Response) return res;
    return decode(res);
  };
}

function isJSON(val: unknown): val is Record<string, unknown> {
  try {
    const s = JSON.stringify(val);
    JSON.parse(s);
    return true;
  } catch {
    return false;
  }
}

function decode(res: unknown) {
  // deno-fmt-ignore
  if (typeof res === "string" || res instanceof ArrayBuffer ||
    res instanceof Uint8Array || res instanceof ReadableStream)
    return new Response(res);

  if (isJSON(res) || Array.isArray(res)) return Response.json(res);
  if (res === null || res === undefined) {
    return new Response(null, { status: 204 });
  }

  if (res instanceof Blob || res instanceof File) {
    const headers = new Headers();
    headers.set("Content-Type", res.type);
    headers.set("Content-Length", res.size.toString());
  }

  throw new Error("Invalid response");
}
