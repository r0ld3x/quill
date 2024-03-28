import { Gem, User } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

import { getUserSubscriptionPlan } from "@/lib/stripe";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import Image from "next/image";
import Link from "next/link";

const UserAccountNav = async ({
  email,
  imageUrl,
  name,
}: {
  email: string | null;
  imageUrl: string | null;
  name: string | null;
}) => {
  const subscription = await getUserSubscriptionPlan();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="overflow-hidden">
        <Button className="rounded-full h-8 w-8 aspect-square bg-slate-400">
          <Avatar className="relative w-8 h-8 ">
            {imageUrl ? (
              <div className="relative aspect-square h-full w-full ">
                <Image
                  src={imageUrl}
                  alt={name ?? "Profile Pic"}
                  referrerPolicy="no-referrer"
                  layout="fill"
                />
              </div>
            ) : (
              <AvatarFallback>
                {" "}
                <span className="sr-only"></span>{" "}
                <User className="h-4 w-4 text-zinc-900" />
              </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-0.5 leading-none">
            {name && <p className="font-medium text-sm text-black ">{name}</p>}
            {email && (
              <p className="w-[200px] truncate text-xs text-zinc-700">
                {email}
              </p>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href={"/dashboard"}>Dashboard</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          {subscription?.isSubscribed ? (
            <Link href={"/dashboard/billing"}>Billing</Link>
          ) : (
            <Link href={"/pricing"}>
              Upgrade <Gem className="text-blue-600 h-4 w-4 ml-1.5" />
            </Link>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <LogoutLink>Logout</LogoutLink>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserAccountNav;
