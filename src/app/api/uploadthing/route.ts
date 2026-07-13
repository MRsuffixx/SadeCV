import { createRouteHandler } from "uploadthing/next";

import { uploadRouter } from "~/server/uploadthing";
import { getUploadThingConfiguration } from "~/server/uploadthing-config";

export const runtime = "nodejs";

const configuration = getUploadThingConfiguration();

const unavailable = () =>
  Response.json(
    {
      error:
        "File uploads are unavailable. Configure a v7 UPLOADTHING_TOKEN from the UploadThing dashboard.",
      code: "UPLOADTHING_NOT_CONFIGURED",
    },
    { status: 503 },
  );

const handlers = configuration.configured
  ? createRouteHandler({
      router: uploadRouter,
      config: { token: configuration.token },
    })
  : { GET: unavailable, POST: unavailable };

export const GET = handlers.GET;
export const POST = handlers.POST;
