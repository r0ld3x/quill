"use client";
import { trpc } from "@/app/_trpc/client";
import { ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";

const UpgradeButton = () => {
  const { toast } = useToast();
  const { mutate: createStripeSession } = trpc.createStripeSession.useMutation({
    async onSuccess({ url }, variables, context) {
      window.location.href = url ?? "/dashboard/billing";
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again later.",
        variant: "destructive",
      });
    },
  });

  return (
    <Button className="w-full" onClick={() => createStripeSession()}>
      Upgrade Now
      <ArrowRight className="h-5 w-5 ml-1.5" />
    </Button>
  );
};

export default UpgradeButton;
