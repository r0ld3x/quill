"use client";

import { trpc } from "@/app/_trpc/client";
import { getUserSubscriptionPlan } from "@/lib/stripe";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import MaxWidthWrapper from "./MaxWidthWrapper";
import { Button } from "./ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { useToast } from "./ui/use-toast";

const BillingForm = ({
  subscription,
}: {
  subscription: Awaited<ReturnType<typeof getUserSubscriptionPlan>>;
}) => {
  const { toast } = useToast();

  const { mutate: createStripeSession, isLoading } =
    trpc.createStripeSession.useMutation({
      async onSuccess({ url }, variables, context) {
        if (url) window.location.href = url;
        if (!url) {
          toast({
            title: "Error",
            description: "Something went wrong",
            variant: "destructive",
          });
        }
      },
    });
  return (
    <MaxWidthWrapper className="max-w-5xl">
      <form
        className="mt-12"
        onSubmit={(e) => {
          e.preventDefault();
          createStripeSession();
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Subscription Plan</CardTitle>
            <CardDescription>
              You are currently on the <strong>{subscription.name} </strong>{" "}
              plan
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col items-start space-y-2 md:flex-row md:justify-between md:space-x-0">
            <Button type="submit" className="font-semibold">
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-4 animate-spin" />
              ) : null}
              {subscription.isSubscribed
                ? "Manage Subscription"
                : "Upgrade to PRO"}
            </Button>
            {subscription.isSubscribed ? (
              <p className="rounded-full text-xs font-medium">
                {subscription.isCanceled
                  ? "Your plan will be cancelled on"
                  : "Your plan is renews on"}
                {format(subscription.stripeCurrentPeriodEnd!, "dd.MM.yyyy")}
              </p>
            ) : null}
          </CardFooter>
        </Card>
      </form>
    </MaxWidthWrapper>
  );
};

export default BillingForm;
