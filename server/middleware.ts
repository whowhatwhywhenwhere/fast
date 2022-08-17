import { isValidElement } from "https://esm.sh/react@18.2.0";
import { renderToString } from "https://esm.sh/react-dom@18.2.0/server";
import { Context, ServerError } from "./context.ts";

export type Middleware = (
  ctx: Context,
  next: NextFunction,
) => Promise<unknown> | unknown;

export type NextFunction = (
  ctx: Context,
) => Promise<Response>;

// deno-lint-ignore no-explicit-any
function convert(error: any) {
  let { message, expose = false, init = { status: 500 } } = error;
  if (!expose) message = "Internal Server Error";
  const { status } = init;
  return Response.json({ error: { status, message } }, init);
}

export function compose(middlewares: Middleware[]) {
  let cur = -1;
  let next: NextFunction;
  return next = async (ctx: Context) => {
    try {
      const res = await middlewares[++cur](ctx, next);
      return decode(res);
    } catch (error) {
      return convert(error);
    }
  };
}

function isJSON(val: unknown) {
  try {
    const s = JSON.stringify(val);
    JSON.parse(s);
    return true;
  } catch {
    return false;
  }
}

export function decode(res: unknown) {
  if (res instanceof Response) return res;

  // deno-fmt-ignore
  if (typeof res === "string" || res instanceof ArrayBuffer ||
    res instanceof Uint8Array || res instanceof ReadableStream)
    return new Response(res);

  // @ts-ignore broken
  if (isValidElement(res)) {
    const root = renderToString(res);
    const headers = { "content-type": "text/html" };
    return new Response(root, { headers });
  }

  if (res === null || res === undefined) {
    return new Response(null, { status: 204 });
  }

  if (res instanceof Blob || res instanceof File) {
    const headers = new Headers();
    if (res.type) headers.set("Content-Type", res.type);
    headers.set("Content-Length", res.size.toString());
    return new Response(res, { headers });
  }

  if (isJSON(res) || Array.isArray(res)) return Response.json(res);

  throw new ServerError(500, "decode(): bad response");
}
