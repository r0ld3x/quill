import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";

import { getPineconeClient } from "@/lib/pincone";
import { VoyageEmbeddings } from "@langchain/community/embeddings/voyage";

import { PLANS } from "@/config/stripe";
import { getUserSubscriptionPlan } from "@/lib/stripe";
import { PineconeStore } from "@langchain/pinecone";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
const f = createUploadthing();

const middleware = async () => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user || !user.id) throw new Error("Unauthorized");
  const subscription = await getUserSubscriptionPlan();
  return {
    userId: user.id,
    subscription,
  };
};

const onUploadComplete = async ({
  metadata,
  file,
}: {
  metadata: Awaited<ReturnType<typeof middleware>>;
  file: {
    key: string;
    name: string;
    url: string;
  };
}) => {
  const isExists = await db.file.findFirst({
    where: {
      id: file.key,
    },
  });
  if (isExists) return;
  const createFile = await db.file.create({
    data: {
      key: file.key,
      name: file.name,
      url: file.url,
      userId: metadata.userId,
      uploadStatus: "PROCESSING",
    },
  });
  try {
    const response = await fetch(file.url);
    const blob = await response.blob();

    const loader = new PDFLoader(blob, {});
    const pageLevelDocs = await loader.load();
    const { subscription, userId } = metadata;
    const { isSubscribed } = subscription;
    const pagesAmt = pageLevelDocs.length;

    const isProExceeded =
      pagesAmt > PLANS.find((plan) => plan.name === "Pro")!.pagesPerPdf;
    const isFreeExceeded =
      pagesAmt > PLANS.find((plan) => plan.name === "Free")!.pagesPerPdf;
    if ((isSubscribed && isProExceeded) || (!isSubscribed && isFreeExceeded)) {
      await db.file.update({
        data: {
          uploadStatus: "FAILED",
        },
        where: {
          id: createFile.id,
        },
      });
      throw new Error("Pro plan exceeded");
    }

    const pinecone = await getPineconeClient();
    const pineconeIndex = pinecone.Index("quill");
    const embeddings = new VoyageEmbeddings({
      apiKey: process.env.VOYAGEAI_API_KEY!,
      modelName: "voyage-2",
    });

    await PineconeStore.fromDocuments(pageLevelDocs, embeddings, {
      // @ts-expect-error: Let's ignore a compile error like this unreachable code
      pineconeIndex,
      namespace: createFile.id,
      maxConcurrency: 5,
    });

    await db.file.update({
      where: {
        id: createFile.id,
        userId: createFile.userId,
      },
      data: {
        uploadStatus: "SUCCESS",
      },
    });
  } catch (error) {
    console.log(error);
    await db.file.update({
      where: {
        id: createFile.id,
        userId: createFile.userId,
      },
      data: {
        uploadStatus: "FAILED",
      },
    });
  }
};

export const ourFileRouter = {
  freePdfUploader: f({ pdf: { maxFileSize: "4MB" } })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
  paidPdfUploader: f({ pdf: { maxFileSize: "16MB" } })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
