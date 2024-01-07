import { db } from "@/db";
import { SendMessageValidator } from "@/lib/validators/SendMessageValidator";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/dist/types/server";
import { NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
  const body = await req.json();
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user || !user.id || !user?.email)
    return new Response("Unauthorized", { status: 401 });
  const { id: userId } = user;

  const { fileId, message } = SendMessageValidator.parse(body);
  const file = await db.file.findFirst({
    where: {
      id: fileId,
      userId: userId,
    },
  });

  if (!file) return new Response("File not found", { status: 404 });
  await db.message.create({
    data: {
      isUserMessage: true,
      text: message,
      userId,
      fileId,
    },
  });

  return new Response("OK", { status: 200 });
};
