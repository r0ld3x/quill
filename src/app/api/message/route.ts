import { db } from "@/db";
import { anthropic } from "@/lib/authropic";
import { getPineconeClient } from "@/lib/pincone";
import { SendMessageValidator } from "@/lib/validators/SendMessageValidator";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { VoyageEmbeddings } from "@langchain/community/embeddings/voyage";
import { PineconeStore } from "@langchain/pinecone";

import { AnthropicStream, StreamingTextResponse } from "ai";
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

  const embeddings = new VoyageEmbeddings({
    apiKey: process.env.VOYAGEAI_API_KEY!,
    modelName: "voyage-2",
  });

  const pinecone = await getPineconeClient();
  const pineconeIndex = pinecone.Index("quill");
  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    // @ts-expect-error: Let's ignore a compile error like this unreachable code
    pineconeIndex: pineconeIndex,
    namespace: file.id,
  });
  const results = await vectorStore.similaritySearch(message, 4);
  const prevMessages = await db.message.findMany({
    where: {
      fileId: file.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 6,
  });
  const formattedPrevMessages = prevMessages.map((msg) => ({
    role: msg.isUserMessage ? "user" : "assistant",
    content: msg.text,
  }));

  const response = await anthropic.messages.create({
    model: "claude-2.1",
    temperature: 0,
    stream: true,
    max_tokens: 1024,

    messages: [
      {
        role: "user",
        content:
          "Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format.also dont mention about previous conversation or context, suppose like you are talking in a chat without previous conversation or context. Just try to answeer the question and that's all you have to do. and never say about previous conversation or context.",
      },
      {
        role: "assistant",
        content: `Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format. also dont mention about previous conversation or context, suppose like you are talking in a chat without previous conversation or context. Just try to answeer the question and that's all you have to do. and never say about previous conversation or context.`,
      },
      {
        role: "user",
        content: `Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format. \n also dont mention about previous conversation or context, suppose like you are talking in a chat without previous conversation or context. Just try to answeer the question and that's all you have to do. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer. and never say about previous conversation or context.
        
  \n----------------\n
  
  PREVIOUS CONVERSATION:
  ${formattedPrevMessages.map((message) => {
    if (message.role === "user") return `User: ${message.content}\n`;
    return `Assistant: ${message.content}\n`;
  })}
  
  \n----------------\n
  
  CONTEXT:
  ${results.map((r) => r.pageContent).join("\n\n")}
  
  USER INPUT: ${message}`,
      },
    ],
  });

  const stream = AnthropicStream(response, {
    async onCompletion(completion) {
      await db.message.create({
        data: {
          isUserMessage: false,
          text: completion,
          userId,
          fileId,
        },
      });
    },
  });
  return new StreamingTextResponse(stream);
};
