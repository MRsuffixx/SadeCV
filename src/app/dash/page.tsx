import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ResumeGrid } from "~/app/dash/_components/resume-grid";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const resumes = await api.resume.list();

  return (
    <main className="px-4 py-8 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-[1180px]">
        <div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow text-[#277b67]">Your workspace</p>
            <h1 className="mt-3 font-serif text-4xl tracking-[-0.04em] text-[#123f35] sm:text-5xl">
              Make your next move clear.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6d7671]">
              Create a tailored CV for every opportunity, without losing the
              thread of your story.
            </p>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-black/[0.07] bg-white px-4 py-3">
            <div>
              <span className="block text-[10px] font-extrabold tracking-wider text-[#929995] uppercase">
                CVs
              </span>
              <span className="text-lg font-black text-[#26473e]">
                {resumes.length}
              </span>
            </div>
            <span className="h-8 w-px bg-black/10" />
            <div>
              <span className="block text-[10px] font-extrabold tracking-wider text-[#929995] uppercase">
                Ready
              </span>
              <span className="text-lg font-black text-[#26473e]">
                {resumes.filter((resume) => resume.status === "READY").length}
              </span>
            </div>
          </div>
        </div>
        <ResumeGrid initialResumes={resumes} />
      </div>
    </main>
  );
}
