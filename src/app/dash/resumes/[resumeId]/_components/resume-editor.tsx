"use client";

import { ArrowLeft, Check, Download, LoaderCircle, Save } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ResumeEditorPanels } from "~/app/dash/resumes/[resumeId]/_components/resume-editor-panels";
import { ResumePreview } from "~/app/dash/resumes/[resumeId]/_components/resume-preview";
import { useResumeStore } from "~/app/dash/resumes/[resumeId]/_store/resume-store";
import { isResumeReady, type ResumeRecord } from "~/lib/resume-model";
import { api } from "~/trpc/react";

export function ResumeEditor({ resume }: { resume: ResumeRecord }) {
  const activeResumeId = useResumeStore((state) => state.resumeId);
  const hydrate = useResumeStore((state) => state.hydrate);

  useEffect(() => hydrate(resume), [hydrate, resume]);

  if (activeResumeId !== resume.id) {
    return (
      <main className="grid min-h-[calc(100vh-72px)] place-items-center bg-[#e8ebe6]">
        <LoaderCircle className="animate-spin text-[#277b67]" size={28} />
      </main>
    );
  }

  return <HydratedResumeEditor resumeId={resume.id} />;
}

function HydratedResumeEditor({ resumeId }: { resumeId: string }) {
  const title = useResumeStore((state) => state.title);
  const saved = useResumeStore((state) => state.saved);
  const isPublic = useResumeStore((state) => state.isPublic);
  const setTitle = useResumeStore((state) => state.setTitle);
  const setPublic = useResumeStore((state) => state.setPublic);
  const markSaved = useResumeStore((state) => state.markSaved);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const { data: entitlement } = api.billing.entitlements.useQuery();
  const { data: systemStatus } = api.system.status.useQuery();
  const mutation = api.resume.update.useMutation({ onSuccess: markSaved });

  const save = () => {
    const state = useResumeStore.getState();
    mutation.mutate({
      id: resumeId,
      title: state.title,
      template: state.template,
      accentColor: state.accentColor,
      isPublic: state.isPublic,
      content: state.content,
      status: isResumeReady(state.content) ? "READY" : "DRAFT",
    });
  };

  const exportPdf = async () => {
    if (systemStatus?.pdfGeneration === false) {
      setExportError("PDF generation is temporarily unavailable.");
      return;
    }
    setExporting(true);
    setExportError("");
    try {
      const [{ pdf }, { ResumePdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("~/app/dash/resumes/[resumeId]/_components/resume-pdf-document"),
      ]);
      const state = useResumeStore.getState();
      const blob = await pdf(
        <ResumePdfDocument
          data={{
            title: state.title,
            template: state.template,
            accentColor: state.accentColor,
            content: state.content,
          }}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      const safeTitle = state.title
        .trim()
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-|-$/g, "");
      anchor.download = `${safeTitle.length ? safeTitle : "sadecv"}.pdf`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch {
      setExportError("PDF generation failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#e8ebe6]">
      <div className="border-b border-black/[0.08] bg-[#fbfbf8] px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-[1580px] flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/dash"
              aria-label="Back to dashboard"
              className="grid size-9 shrink-0 place-items-center rounded-xl border border-black/10 bg-white text-[#66706b]"
            >
              <ArrowLeft size={17} />
            </Link>
            <div className="min-w-0">
              <input
                aria-label="CV title"
                value={title}
                maxLength={120}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full truncate bg-transparent text-sm font-extrabold outline-none"
              />
              <p className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-[#8b928e]">
                {saved ? (
                  <>
                    <Check size={11} className="text-[#2b806a]" />
                    All changes saved
                  </>
                ) : (
                  "Unsaved changes"
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="hidden items-center gap-2 rounded-full bg-[#edf1ee] px-3 py-2 text-xs font-bold text-[#65706b] sm:flex">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(event) => setPublic(event.target.checked)}
                className="accent-[#277b67]"
              />
              Shareable
            </label>
            <button
              type="button"
              onClick={exportPdf}
              disabled={exporting || systemStatus?.pdfGeneration === false}
              title={
                systemStatus?.pdfGeneration === false
                  ? "PDF generation is temporarily disabled"
                  : undefined
              }
              className="button-secondary min-h-9 px-3 text-xs disabled:opacity-50"
            >
              {exporting ? (
                <LoaderCircle className="animate-spin" size={15} />
              ) : (
                <Download size={15} />
              )}
              <span className="hidden sm:inline">
                {exporting ? "Rendering…" : "Download PDF"}
              </span>
            </button>
            <button
              type="button"
              onClick={save}
              disabled={mutation.isPending || saved}
              className="button-primary min-h-9 px-4 text-xs disabled:opacity-50"
            >
              <Save size={15} />
              {mutation.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
        {mutation.error || exportError ? (
          <p
            role="alert"
            className="mx-auto mt-2 max-w-[1580px] text-xs font-bold text-[#b64632]"
          >
            {exportError || "We couldn’t save these changes. Please try again."}
          </p>
        ) : null}
      </div>

      <div className="mx-auto grid max-w-[1580px] lg:grid-cols-[minmax(420px,480px)_1fr]">
        <section className="max-h-[calc(100vh-133px)] overflow-y-auto border-r border-black/[0.08] bg-[#f8f8f5] p-4 sm:p-6">
          <p className="eyebrow text-[#277b67]">Live editor</p>
          <div className="mt-2 mb-5 flex items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-2xl text-[#123f35]">
                Shape your story.
              </h1>
              <p className="mt-1 text-xs leading-5 text-[#7c8580]">
                Fourteen focused sections, one clear document.
              </p>
            </div>
            <span className="rounded-full bg-[#e6efe9] px-2.5 py-1 text-[9px] font-black tracking-wider text-[#286552] uppercase">
              Schema v3
            </span>
          </div>
          <ResumeEditorPanels
            resumeId={resumeId}
            isPremium={entitlement?.isPremium ?? false}
          />
        </section>
        <ResumePreview />
      </div>
    </main>
  );
}
