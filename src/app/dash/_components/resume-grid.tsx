"use client";

import { Copy, FilePlus2, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { api } from "~/trpc/react";

type ResumeItem = {
  id: string;
  title: string;
  slug: string;
  template: string;
  accentColor: string;
  status: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function ResumeGrid({ initialResumes }: { initialResumes: ResumeItem[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const utils = api.useUtils();
  const [createOpen, setCreateOpen] = useState(searchParams.get("new") === "1");
  const [title, setTitle] = useState("Untitled CV");
  const [template, setTemplate] = useState<"ATLAS" | "MONO" | "EDITORIAL">("ATLAS");
  const { data: resumes = initialResumes } = api.resume.list.useQuery(undefined, {
    initialData: initialResumes,
  });

  useEffect(() => {
    if (searchParams.get("new") === "1") setCreateOpen(true);
  }, [searchParams]);

  const createResume = api.resume.create.useMutation({
    onSuccess: async (resume) => {
      await utils.resume.list.invalidate();
      setCreateOpen(false);
      router.push(`/dash/resumes/${resume.id}`);
    },
  });
  const duplicateResume = api.resume.duplicate.useMutation({
    onSuccess: () => utils.resume.list.invalidate(),
  });
  const deleteResume = api.resume.delete.useMutation({
    onSuccess: () => utils.resume.list.invalidate(),
  });

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="group min-h-[300px] rounded-[1.4rem] border border-dashed border-[#2b6d5b]/25 bg-[#eaf2ee]/45 p-6 text-left transition hover:-translate-y-1 hover:border-[#2b6d5b]/50 hover:bg-[#e5f1ec]"
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-[#123f35] text-white shadow-lg transition group-hover:scale-105"><Plus size={21} /></span>
          <h2 className="mt-20 text-lg font-extrabold tracking-[-0.02em] text-[#23463c]">Create a new CV</h2>
          <p className="mt-2 max-w-xs text-sm leading-6 text-[#71807a]">Start from a focused template and shape it around your next move.</p>
        </button>

        {resumes.map((resume) => (
          <article key={resume.id} className="group overflow-hidden rounded-[1.4rem] border border-black/[0.08] bg-white shadow-[0_12px_40px_rgba(18,63,53,0.05)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(18,63,53,0.1)]">
            <button type="button" onClick={() => router.push(`/dash/resumes/${resume.id}`)} className="block w-full bg-[#e5ebe7] p-5 text-left">
              <div className="mx-auto aspect-[0.74] h-[190px] bg-white p-5 shadow-md">
                <div className="h-3 w-2/3" style={{ backgroundColor: resume.accentColor }} />
                <div className="mt-2 h-1.5 w-1/3 bg-[#ef765f]" />
                <div className="mt-6 grid grid-cols-[0.3fr_0.7fr] gap-3">
                  <div className="space-y-2"><div className="h-1.5 bg-[#cad3ce]" /><div className="h-1.5 w-4/5 bg-[#e5e9e7]" /><div className="h-1.5 bg-[#e5e9e7]" /></div>
                  <div className="space-y-2"><div className="h-1.5 w-1/2 bg-[#cad3ce]" /><div className="h-1.5 bg-[#e5e9e7]" /><div className="h-1.5 w-5/6 bg-[#e5e9e7]" /><div className="mt-4 h-1.5 w-1/2 bg-[#cad3ce]" /></div>
                </div>
              </div>
            </button>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-bold tracking-[-0.01em]">{resume.title}</h3>
                  <p className="mt-1 text-xs font-medium text-[#7d8581]">Edited {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(resume.updatedAt))}</p>
                </div>
                <button type="button" aria-label="More options" className="grid size-8 shrink-0 place-items-center rounded-lg text-[#737b77] hover:bg-black/[0.04]"><MoreHorizontal size={17} /></button>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-black/[0.07] pt-3">
                <span className="rounded-full bg-[#e7f3ee] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#27705e]">{resume.status}</span>
                <div className="flex gap-1">
                  <button type="button" onClick={() => duplicateResume.mutate({ id: resume.id })} aria-label={`Duplicate ${resume.title}`} className="grid size-8 place-items-center rounded-lg text-[#78807c] hover:bg-[#eef2ef] hover:text-[#1e5d4d]"><Copy size={15} /></button>
                  <button type="button" onClick={() => { if (window.confirm(`Delete “${resume.title}”? This cannot be undone.`)) deleteResume.mutate({ id: resume.id }); }} aria-label={`Delete ${resume.title}`} className="grid size-8 place-items-center rounded-lg text-[#78807c] hover:bg-[#fff0ec] hover:text-[#bb4935]"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {createOpen && (
        <div role="dialog" aria-modal="true" aria-labelledby="new-cv-title" className="fixed inset-0 z-50 grid place-items-center bg-[#0b2922]/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[1.5rem] bg-[#fbfbf8] p-6 shadow-2xl sm:p-8">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#e3f0eb] text-[#195744]"><FilePlus2 size={20} /></span>
            <h2 id="new-cv-title" className="mt-5 font-serif text-3xl tracking-[-0.03em] text-[#123f35]">Begin with intention.</h2>
            <p className="mt-2 text-sm leading-6 text-[#707975]">Give this CV a working title and choose a starting style. Both can change later.</p>
            <div className="mt-6">
              <label htmlFor="resume-title" className="field-label">CV title</label>
              <input id="resume-title" className="field" value={title} onChange={(event) => setTitle(event.target.value)} autoFocus maxLength={120} />
            </div>
            <div className="mt-5">
              <span className="field-label">Template</span>
              <div className="grid grid-cols-3 gap-2">
                {(["ATLAS", "MONO", "EDITORIAL"] as const).map((value) => (
                  <button key={value} type="button" onClick={() => setTemplate(value)} className={`rounded-xl border px-3 py-3 text-xs font-extrabold transition ${template === value ? "border-[#277b67] bg-[#e5f1ec] text-[#195947]" : "border-black/10 bg-white text-[#707874] hover:border-black/20"}`}>{value[0]}{value.slice(1).toLowerCase()}</button>
                ))}
              </div>
            </div>
            {createResume.error && <p role="alert" className="mt-4 text-sm font-semibold text-[#b64632]">We couldn&apos;t create this CV. Please try again.</p>}
            <div className="mt-7 flex justify-end gap-2">
              <button type="button" onClick={() => setCreateOpen(false)} className="button-secondary min-h-11">Cancel</button>
              <button type="button" disabled={!title.trim() || createResume.isPending} onClick={() => createResume.mutate({ title, template })} className="button-primary min-h-11 disabled:opacity-50">{createResume.isPending ? "Creating…" : "Create CV"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

