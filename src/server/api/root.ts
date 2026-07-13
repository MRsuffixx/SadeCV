import { billingRouter } from "~/server/api/routers/billing";
import { postRouter } from "~/server/api/routers/post";
import { resumeRouter } from "~/server/api/routers/resume";
import { systemRouter } from "~/server/api/routers/system";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  admin: adminRouter,
  billing: billingRouter,
  post: postRouter,
  resume: resumeRouter,
  system: systemRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
import { adminRouter } from "~/server/api/routers/admin";
