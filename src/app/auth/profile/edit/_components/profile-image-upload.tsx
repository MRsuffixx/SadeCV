"use client";

import { Camera, CheckCircle2, LoaderCircle } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

import { useUploadThing } from "~/utils/uploadthing";

export function ProfileImageUpload({
  initialUrl,
  name,
}: {
  initialUrl: string | null;
  name: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(initialUrl);
  const [message, setMessage] = useState("");
  const { startUpload, isUploading } = useUploadThing("profileImage", {
    onClientUploadComplete: (files) => {
      const url = files[0]?.serverData.url;
      if (url) setPreview(url);
      setMessage("Profile photo updated");
    },
    onUploadError: () => setMessage("The photo could not be uploaded."),
  });

  return (
    <section className="rounded-[1.4rem] border border-black/[0.08] bg-white p-6 shadow-[0_12px_40px_rgba(18,63,53,0.05)]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-[1.6rem] bg-[#e5f0eb] font-serif text-3xl text-[#175442]">
          {preview ? (
            <Image
              src={preview}
              alt={`${name ?? "User"} profile`}
              width={96}
              height={96}
              unoptimized
              className="size-full object-cover"
            />
          ) : (
            (name?.trim()[0] ?? "S").toUpperCase()
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-extrabold tracking-[-0.02em]">
            Profile photo
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#737c77]">
            JPG, PNG, or WebP up to 4 MB. Your account stores only the secure
            cloud URL.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setMessage("");
              await startUpload([file]);
              event.target.value = "";
            }}
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
              className="button-secondary min-h-10 rounded-xl px-4 text-xs disabled:opacity-50"
            >
              {isUploading ? (
                <LoaderCircle className="animate-spin" size={15} />
              ) : (
                <Camera size={15} />
              )}
              {isUploading ? "Uploading…" : "Choose photo"}
            </button>
            {message && (
              <span
                role="status"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2b6d5b]"
              >
                <CheckCircle2 size={14} />
                {message}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
