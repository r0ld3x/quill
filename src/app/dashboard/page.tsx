import DashBoard from "@/components/DashBoard";
import { db } from "@/db";
import { getUserSubscriptionPlan } from "@/lib/stripe";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";

const Page = async () => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) return redirect("/auth-callback?origin=dashboard");
  const dbUser = await db.user.findFirst({
    where: {
      id: user.id,
    },
  });

  const subscription = await getUserSubscriptionPlan()
  return <DashBoard  isSubscribed={subscription.isSubscribed}/>;
};

export default Page;
