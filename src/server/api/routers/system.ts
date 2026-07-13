import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { isFeatureEnabled } from "~/server/system/feature-flags";
import { getUploadThingConfiguration } from "~/server/uploadthing-config";

export const systemRouter = createTRPCRouter({
  status: publicProcedure.query(async ({ ctx }) => {
    const [pdfGeneration, registration, maintenanceMode] = await Promise.all([
      isFeatureEnabled(ctx.db, "PDF_GENERATION"),
      isFeatureEnabled(ctx.db, "REGISTRATION"),
      isFeatureEnabled(ctx.db, "MAINTENANCE_MODE"),
    ]);
    return {
      pdfGeneration,
      registration,
      maintenanceMode,
      uploads: getUploadThingConfiguration().configured,
    };
  }),
});
