import type { Metadata } from "next";

import { ResumeEditor } from "~/app/dash/resumes/[resumeId]/_components/resume-editor";
import { api } from "~/trpc/server";

export const metadata: Metadata = { title: "CV editor" };

export default async function ResumeEditorPage({ params }: { params: Promise<{ resumeId: string }> }) {
  const { resumeId } = await params;
  const resume = await api.resume.get({ id: resumeId });
  return <ResumeEditor resume={resume} />;
}

