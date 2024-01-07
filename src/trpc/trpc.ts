import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { TRPCError, initTRPC } from "@trpc/server";

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.create();
const middleware = t.middleware(async (options) => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user || !user.id || !user?.email)
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
  return options.next({
    ctx: {
      id: user.id,
    },
  });
});

const isLoggedIn = middleware;

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const publicProcedure = t.procedure;
export const privateProcedure = t.procedure.use(isLoggedIn);
