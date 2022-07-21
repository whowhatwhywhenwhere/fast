import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.149.0/testing/asserts.ts";
import { Context } from "./context.ts";

const request = new Request("http://localhost:8000");
const params = {};
const ctx = new Context({ request, params });

Deno.test("ctx.throw", () => {
  const fn = () => ctx.throw();
  assertThrows(fn);
});

Deno.test("ctx.assert", () => {
  const fn = () => ctx.assert(false);
  assertThrows(fn);
});

Deno.test("ctx.redirect", () => {
  const res = ctx.redirect("/hello");
  const to = res.headers.get("location");
  assertEquals(to, "http://localhost:8000/hello");
});
