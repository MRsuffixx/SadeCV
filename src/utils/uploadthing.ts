import { generateReactHelpers } from "@uploadthing/react";

import type { UploadRouter } from "~/server/uploadthing";

export const { useUploadThing, uploadFiles } =
  generateReactHelpers<UploadRouter>();
