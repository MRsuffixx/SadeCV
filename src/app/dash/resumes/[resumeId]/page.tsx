import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ResumeEditor } from "~/app/dash/resumes/[resumeId]/_components/resume-editor";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

export const metadata: Metadata = { title: "CV editor" };

export default async function ResumeEditorPage({
  params,
}: {
  params: Promise<{ resumeId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const { resumeId } = await params;
  const resume = await api.resume.get({ id: resumeId });
  return <ResumeEditor resume={resume} />;
}
