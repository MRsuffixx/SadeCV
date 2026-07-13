"use client";

import {
  ArrowLeft,
  Check,
  Crown,
  Download,
  LoaderCircle,
  Save,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ResumeEditorPanels } from "~/app/dash/resumes/[resumeId]/_components/resume-editor-panels";
import { ResumePreview } from "~/app/dash/resumes/[resumeId]/_components/resume-preview";
import { useResumeStore } from "~/app/dash/resumes/[resumeId]/_store/resume-store";
import {
  isResumeReady,
  resumeDraftContentSchema,
  type ResumeRecord,
} from "~/lib/resume-model";
import { getTemplateDefinition } from "~/templates/registry";
import { api } from "~/trpc/react";

export function ResumeEditor({ resume }: { resume: ResumeRecord }) {
  const activeResumeId = useResumeStore((state) => state.resumeId);
  const hydrate = useResumeStore((state) => state.hydrate);

  const hydrationError = useResumeStore((state) => state.hydrationError);

  useEffect(() => {
    const state = useResumeStore.getState();
    const serverUpdatedAt = new Date(resume.updatedAt).getTime();
    if (
      state.resumeId !== resume.id ||
      (state.saved && state.hydratedUpdatedAt !== serverUpdatedAt)
    ) {
      hydrate(resume);
    }
  }, [hydrate, resume]);

  if (activeResumeId !== resume.id) {
    return (
      <main className="grid min-h-[calc(100vh-72px)] place-items-center bg-[#e8ebe6]">
        <LoaderCircle className="animate-spin text-[#277b67]" size={28} />
      </main>
    );
  }

  if (hydrationError) {
    return (
      <main className="grid min-h-[calc(100vh-72px)] place-items-center bg-[#e8ebe6] px-6">
        <section className="max-w-lg rounded-[1.5rem] border border-[#b64632]/20 bg-white p-8 text-center shadow-xl">
          <h1 className="font-serif text-3xl text-[#123f35]">
            This CV needs recovery.
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#66706b]">
            Its stored content could not be validated, so editing has been
            locked to prevent accidental data loss. Contact an administrator to
            restore a previous version.
          </p>
          <Link href="/dash" className="button-primary mt-6">
            <ArrowLeft size={16} /> Back to dashboard
          </Link>
        </section>
      </main>
    );
  }

  return <HydratedResumeEditor resumeId={resume.id} />;
}

function HydratedResumeEditor({ resumeId }: { resumeId: string }) {
  const title = useResumeStore((state) => state.title);
  const saved = useResumeStore((state) => state.saved);
  const isPublic = useResumeStore((state) => state.isPublic);
  const selectedTemplateId = useResumeStore(
    (state) => state.selectedTemplateId,
  );
  const setTitle = useResumeStore((state) => state.setTitle);
  const setPublic = useResumeStore((state) => state.setPublic);
  const markSaved = useResumeStore((state) => state.markSaved);
  const [saveError, setSaveError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const { data: entitlement } = api.billing.entitlements.useQuery();
  const { data: systemStatus } = api.system.status.useQuery();
  const mutation = api.resume.update.useMutation();
  const isPremium = entitlement?.isPremium ?? false;
  const premiumLocked =
    getTemplateDefinition(selectedTemplateId).isPremium && !isPremium;

  const save = () => {
    const state = useResumeStore.getState();
    const parsedContent = resumeDraftContentSchema.safeParse(state.content);
    if (!parsedContent.success) {
      const issue = parsedContent.error.issues[0];
      const field = issue?.path.length ? `${issue.path.join(" ")}: ` : "";
      setSaveError(
        `${field}${issue?.message ?? "Check the highlighted CV fields."}`,
      );
      return;
    }
    setSaveError("");
    mutation.mutate(
      {
        id: resumeId,
        title: state.title,
        template: state.selectedTemplateId,
        theme: state.theme,
        isPublic: premiumLocked ? false : state.isPublic,
        content: parsedContent.data,
        status:
          !premiumLocked && isResumeReady(parsedContent.data)
            ? "READY"
            : "DRAFT",
      },
      {
        onSuccess: () => markSaved(parsedContent.data),
      },
    );
  };

  const exportPdf = async () => {
    if (systemStatus?.pdfGeneration === false) {
      setExportError("PDF generation is temporarily unavailable.");
      return;
    }
    setExporting(true);
    setExportError("");
    try {
      const state = useResumeStore.getState();
      const response = await fetch(`/api/resumes/${resumeId}/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: state.title,
          template: state.selectedTemplateId,
          theme: state.theme,
          content: state.content,
        }),
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        if (response.status === 402) {
          setExportError("Upgrade to Premium to export this template.");
          return;
        }
        throw new Error(result?.error ?? "PDF_EXPORT_FAILED");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      const safeTitle = state.title
        .trim()
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-|-$/g, "");
      anchor.download = `${safeTitle.length ? safeTitle : "sadecv"}-${resumeId.slice(-8)}.pdf`;
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
                checked={premiumLocked ? false : isPublic}
                disabled={premiumLocked}
                onChange={(event) => setPublic(event.target.checked)}
                className="accent-[#277b67] disabled:opacity-40"
              />
              {premiumLocked ? "Preview only" : "Shareable"}
            </label>
            {premiumLocked ? (
              <Link
                href="/pricing"
                className="button-secondary min-h-9 border-[#d8b268]/45 bg-[#fff8e9] px-3 text-xs text-[#805c24] shadow-[0_0_0_3px_rgba(216,178,104,0.08)]"
                title="Premium template export"
              >
                <Crown size={15} />
                <span className="hidden sm:inline">Unlock PDF</span>
              </Link>
            ) : (
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
            )}
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
        {mutation.error || exportError || saveError ? (
          <p
            role="alert"
            className="mx-auto mt-2 max-w-[1580px] text-xs font-bold text-[#b64632]"
          >
            {exportError ||
              saveError ||
              "We couldn’t save these changes. Please try again."}
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
            isPremium={isPremium}
            uploadsEnabled={systemStatus?.uploads === true}
          />
        </section>
        <ResumePreview isPremium={isPremium} />
      </div>
    </main>
  );
}
