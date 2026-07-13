import { createRouteHandler } from "uploadthing/next";

import { uploadRouter } from "~/server/uploadthing";

export const runtime = "nodejs";

export const { GET, POST } = createRouteHandler({ router: uploadRouter });
