import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";

import { pinecone } from "@/lib/pincone";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";

import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";

const f = createUploadthing();

const auth = (req: Request) => ({ id: "fakeId" });

export const ourFileRouter = {
  PdfUploader: f({ pdf: { maxFileSize: "4MB" } })
    .middleware(async ({ req }) => {
      const { getUser } = getKindeServerSession();
      const user = await getUser();
      if (!user || !user.id) throw new Error("Unauthorized");
      return {
        userId: user.id,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
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
        const loader = new PDFLoader(blob);
        const pageLevelDocs = await loader.load();
        const pagesAmt = pageLevelDocs.length;
        const pineconeIndex = pinecone.index("quill-dev");
        const embeddings = new OpenAIEmbeddings({
          openAIApiKey: process.env.OPENAI_KEY!,
        });
        await PineconeStore.fromDocuments(pageLevelDocs, embeddings, {
          pineconeIndex,
          namespace: createFile.id,
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
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
