import { Files } from "lucide-react";

import { ResumeModeration } from "~/app/admin/resumes/_components/resume-moderation";

export default function AdminResumesPage() {
  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="flex items-center gap-4">
        <span className="grid size-12 place-items-center rounded-2xl bg-[#dfece6] text-[#226651]">
          <Files size={22} />
        </span>
        <div>
          <p className="text-xs font-black tracking-[0.15em] text-[#2d7864] uppercase">
            Content safety
          </p>
          <h1 className="mt-1 font-serif text-4xl tracking-[-0.04em] text-[#123f35]">
            Resume moderation
          </h1>
        </div>
      </div>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-[#6e7873]">
        Review platform-wide CV metadata and remove content that violates
        platform terms.
      </p>
      <ResumeModeration />
    </div>
  );
}
