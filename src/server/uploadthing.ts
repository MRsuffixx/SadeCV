import {
  createUploadthing,
  UploadThingError,
  type FileRouter,
} from "uploadthing/server";
import { z } from "zod";

import { auth } from "~/server/auth";
import { db } from "~/server/db";

const f = createUploadthing();

async function authenticatedUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UploadThingError({ code: "UNAUTHORIZED" });
  }
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, bannedAt: true },
  });
  if (!user || user.bannedAt) {
    throw new UploadThingError({ code: "FORBIDDEN" });
  }
  return session.user;
}

export const uploadRouter = {
  profileImage: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => ({ user: await authenticatedUser() }))
    .onUploadComplete(async ({ metadata, file }) => {
      await db.user.update({
        where: { id: metadata.user.id },
        data: { image: file.ufsUrl },
      });
      return { url: file.ufsUrl };
    }),

  resumeAsset: f({
    image: { maxFileSize: "8MB", maxFileCount: 1 },
    pdf: { maxFileSize: "16MB", maxFileCount: 1 },
  })
    .input(z.object({ resumeId: z.string().cuid() }))
    .middleware(async ({ input }) => {
      const user = await authenticatedUser();
      const resume = await db.resume.findFirst({
        where: { id: input.resumeId, userId: user.id },
        select: { id: true },
      });
      if (!resume) throw new UploadThingError({ code: "NOT_FOUND" });
      return { userId: user.id, resumeId: resume.id };
    })
    .onUploadComplete(({ file, metadata }) => ({
      url: file.ufsUrl,
      resumeId: metadata.resumeId,
    })),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
