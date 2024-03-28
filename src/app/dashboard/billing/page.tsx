import BillingForm from "@/components/BillingForm";
import { getUserSubscriptionPlan } from "@/lib/stripe";

const Page = async () => {
  const subscription = await getUserSubscriptionPlan();

  return <BillingForm subscription={subscription}></BillingForm>;
};

export default Page;
