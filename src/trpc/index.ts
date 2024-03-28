import { PLANS } from "@/config/stripe";
import { db } from "@/db";
import { getUserSubscriptionPlan, stripe } from "@/lib/stripe";
import { absoluteUrl } from "@/lib/utils";
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
  createStripeSession: privateProcedure.mutation(async ({ ctx }) => {
    const { id } = ctx;
    const billingUrl = absoluteUrl("/dashboard/billing");
    if (!id)
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
    const dbUser = await db.user.findFirst({
      where: {
        id,
      },
    });
    if (!dbUser)
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });

    const subscription = await getUserSubscriptionPlan();
    if (subscription.isSubscribed && dbUser.stripeCustomerId) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: dbUser.stripeCustomerId,
        return_url: billingUrl,
      });

      return {
        url: stripeSession.url,
      };
    }
    const stripeSession = await stripe.checkout.sessions.create({
      success_url: billingUrl,
      cancel_url: billingUrl,
      customer_email: dbUser.email,
      payment_method_types: ["card", "paypal"],
      mode: "subscription",
      billing_address_collection: "auto",
      line_items: [
        {
          price: PLANS.find((plan) => plan.name === "Pro")?.price.priceIds.test,
          quantity: 1,
        },
      ],
      metadata: {
        userId: id,
      },
    });
    return { url: stripeSession.url };
  }),
  getFileMessages: privateProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        fileId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { id } = ctx;
      const { fileId, cursor } = input;
      const limit = input.limit ?? 10;
      const file = await db.file.findFirst({
        where: {
          id: fileId,
          userId: id,
        },
      });
      if (!file) throw new TRPCError({ code: "NOT_FOUND" });
      const messages = await db.message.findMany({
        take: 11,

        where: {
          fileId,
        },
        orderBy: {
          createdAt: "desc",
        },
        cursor: cursor ? { id: cursor } : undefined,
        select: {
          id: true,
          isUserMessage: true,
          createdAt: true,
          text: true,
        },
      });
      let nextCursor: typeof cursor | undefined = undefined;
      if (messages.length > 10) {
        const nextItem = messages.pop();
        nextCursor = nextItem?.id;
      }
      return {
        messages,
        nextCursor,
      };
    }),
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;
