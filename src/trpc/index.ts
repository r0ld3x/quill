import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { privateProcedure, publicProcedure, router } from "./trpc";

export const appRouter = router({
  authCallback: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    if (!user || !user.id || !user?.email)
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
    const dbUser = await db.user.findUnique({
      where: {
        id: user.id,
      },
    });
    if (!dbUser) {
      await db.user.create({
        data: {
          email: user.email,
          id: user.id,
        },
      });
    }
    return { success: true };
  }),
  getUserFiles: privateProcedure.query(async ({ ctx }) => {
    const { id } = ctx;

    return await db.file.findMany({
      where: {
        userId: id,
      },
    });
  }),
  getFileUploadStatus: privateProcedure
    .input(z.object({ fileId: z.string() }))
    .query(async ({ input, ctx }) => {
      const file = await db.file.findFirst({
        where: {
          id: input.fileId,
          userId: ctx.id,
        },
      });
      if (!file) return { status: "PENDING" as const };

      return { status: file.uploadStatus };
    }),
  getFile: privateProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = ctx;
      const file = await db.file.findFirst({
        where: {
          key: input.key,
          userId: id,
        },
      });
      if (!file)
        throw new TRPCError({ code: "NOT_FOUND", message: "File not found" });
      return file;
    }),
  deleteFile: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = ctx;
      const file = await db.file.findFirst({
        where: {
          id: input.id,
          userId: id,
        },
      });
      if (!file) throw new TRPCError({ code: "NOT_FOUND" });
      await db.file.delete({
        where: {
          id: input.id,
          userId: id,
        },
      });
      return file;
    }),
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
