import { definePlugin } from "nitro";
import { initRuntime, closeRuntime } from "../src/server/runtime";
export default definePlugin(async (app) => {
  await initRuntime();
  app.hooks.hook("close", closeRuntime);
});
