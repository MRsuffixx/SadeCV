"use client";

import {
  Copy,
  Crown,
  FilePlus2,
  LockKeyhole,
  MoreHorizontal,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { api } from "~/trpc/react";
import type { ResumeTemplate } from "~/lib/resume-model";
import { TEMPLATE_DEFINITIONS } from "~/templates/registry";

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

const resumeDate = new Intl.DateTimeFormat("en", { dateStyle: "medium" });
const resetDate = new Intl.DateTimeFormat("en", { dateStyle: "long" });

export function ResumeGrid({
  initialResumes,
}: {
  initialResumes: ResumeItem[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const utils = api.useUtils();
  const [createOpen, setCreateOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [title, setTitle] = useState("Untitled CV");
  const [template, setTemplate] = useState<ResumeTemplate>("ATLAS");
  const quota = api.resume.quota.useQuery();
  const { data: resumes = initialResumes } = api.resume.list.useQuery(
    undefined,
    {
      initialData: initialResumes,
    },
  );

  const openCreator = async () => {
    const result = await quota.refetch();
    if (result.data?.canCreate) setCreateOpen(true);
    else setPaywallOpen(true);
  };

  useEffect(() => {
    if (searchParams.get("new") === "1" && quota.data) {
      if (quota.data.canCreate) setCreateOpen(true);
      else setPaywallOpen(true);
    }
  }, [quota.data, searchParams]);

  const createResume = api.resume.create.useMutation({
    onSuccess: async (resume) => {
      await utils.resume.list.invalidate();
      await utils.resume.quota.invalidate();
      setCreateOpen(false);
      router.push(`/dash/resumes/${resume.id}`);
    },
  });
  const duplicateResume = api.resume.duplicate.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.resume.list.invalidate(),
        utils.resume.quota.invalidate(),
      ]);
    },
    onError: (error) => {
      if (error.message.includes("RESUME_QUOTA_EXCEEDED")) {
        setPaywallOpen(true);
      }
    },
  });
  const deleteResume = api.resume.delete.useMutation({
    onSuccess: () => utils.resume.list.invalidate(),
  });

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <button
          type="button"
          onClick={openCreator}
          aria-disabled={quota.data ? !quota.data.canCreate : true}
          className={`group min-h-[300px] rounded-[1.4rem] border border-dashed p-6 text-left transition ${quota.data && !quota.data.canCreate ? "border-[#b7a77b]/35 bg-[#f1eee5]" : "border-[#2b6d5b]/25 bg-[#eaf2ee]/45 hover:-translate-y-1 hover:border-[#2b6d5b]/50 hover:bg-[#e5f1ec]"}`}
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-[#123f35] text-white shadow-lg transition group-hover:scale-105">
            {quota.data && !quota.data.canCreate ? (
              <LockKeyhole size={19} />
            ) : (
              <Plus size={21} />
            )}
          </span>
          <h2 className="mt-20 text-lg font-extrabold tracking-[-0.02em] text-[#23463c]">
            {quota.data && !quota.data.canCreate
              ? "Monthly CV used"
              : "Create a new CV"}
          </h2>
          <p className="mt-2 max-w-xs text-sm leading-6 text-[#71807a]">
            {quota.data && !quota.data.canCreate
              ? "Your free plan renews next month. Premium keeps your momentum unlimited."
              : "Start from a focused template and shape it around your next move."}
          </p>
        </button>

        {resumes.map((resume) => (
          <article
            key={resume.id}
            className="group overflow-hidden rounded-[1.4rem] border border-black/[0.08] bg-white shadow-[0_12px_40px_rgba(18,63,53,0.05)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(18,63,53,0.1)]"
          >
            <button
              type="button"
              onClick={() => router.push(`/dash/resumes/${resume.id}`)}
              className="block w-full bg-[#e5ebe7] p-5 text-left"
            >
              <div className="mx-auto aspect-[0.74] h-[190px] bg-white p-5 shadow-md">
                <div
                  className="h-3 w-2/3"
                  style={{ backgroundColor: resume.accentColor }}
                />
                <div className="mt-2 h-1.5 w-1/3 bg-[#ef765f]" />
                <div className="mt-6 grid grid-cols-[0.3fr_0.7fr] gap-3">
                  <div className="space-y-2">
                    <div className="h-1.5 bg-[#cad3ce]" />
                    <div className="h-1.5 w-4/5 bg-[#e5e9e7]" />
                    <div className="h-1.5 bg-[#e5e9e7]" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-1.5 w-1/2 bg-[#cad3ce]" />
                    <div className="h-1.5 bg-[#e5e9e7]" />
                    <div className="h-1.5 w-5/6 bg-[#e5e9e7]" />
                    <div className="mt-4 h-1.5 w-1/2 bg-[#cad3ce]" />
                  </div>
                </div>
              </div>
            </button>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-bold tracking-[-0.01em]">
                    {resume.title}
                  </h3>
                  <p className="mt-1 text-xs font-medium text-[#7d8581]">
                    Edited {resumeDate.format(new Date(resume.updatedAt))}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="More options"
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-[#737b77] hover:bg-black/[0.04]"
                >
                  <MoreHorizontal size={17} />
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-black/[0.07] pt-3">
                <span className="rounded-full bg-[#e7f3ee] px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-[#27705e] uppercase">
                  {resume.status}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => duplicateResume.mutate({ id: resume.id })}
                    aria-label={`Duplicate ${resume.title}`}
                    className="grid size-8 place-items-center rounded-lg text-[#78807c] hover:bg-[#eef2ef] hover:text-[#1e5d4d]"
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete “${resume.title}”? This cannot be undone.`,
                        )
                      )
                        deleteResume.mutate({ id: resume.id });
                    }}
                    aria-label={`Delete ${resume.title}`}
                    className="grid size-8 place-items-center rounded-lg text-[#78807c] hover:bg-[#fff0ec] hover:text-[#bb4935]"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {deleteResume.error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-[#b9503c]/20 bg-[#fff0ec] px-4 py-3 text-sm font-semibold text-[#a33e2b]"
        >
          This CV could not be deleted. Please refresh and try again.
        </p>
      ) : null}

      {createOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-cv-title"
          className="fixed inset-0 z-50 grid place-items-center bg-[#0b2922]/45 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg rounded-[1.5rem] bg-[#fbfbf8] p-6 shadow-2xl sm:p-8">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#e3f0eb] text-[#195744]">
              <FilePlus2 size={20} />
            </span>
            <h2
              id="new-cv-title"
              className="mt-5 font-serif text-3xl tracking-[-0.03em] text-[#123f35]"
            >
              Begin with intention.
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#707975]">
              Give this CV a working title and choose a starting style. Both can
              change later.
            </p>
            <div className="mt-6">
              <label htmlFor="resume-title" className="field-label">
                CV title
              </label>
              <input
                id="resume-title"
                className="field"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                autoFocus
                maxLength={120}
              />
            </div>
            <div className="mt-5">
              <span className="field-label">Template</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {TEMPLATE_DEFINITIONS.map((definition) => (
                  <button
                    key={definition.id}
                    type="button"
                    onClick={() => setTemplate(definition.id)}
                    className={`relative min-h-16 rounded-xl border px-3 py-3 text-left text-xs font-extrabold transition ${template === definition.id ? "border-[#277b67] bg-[#e5f1ec] text-[#195947]" : "border-black/10 bg-white text-[#707874] hover:border-black/20"}`}
                  >
                    <span className="block pr-6">{definition.name}</span>
                    <span className="mt-1 block text-[8px] font-black tracking-wider uppercase opacity-55">
                      {definition.category}
                    </span>
                    {definition.isPremium ? (
                      <Crown
                        size={11}
                        className="absolute top-2 right-2 text-[#d18a35]"
                      />
                    ) : null}
                  </button>
                ))}
              </div>
              {getSelectedTemplatePremium(template) &&
              !quota.data?.isPremium ? (
                <p className="mt-2 rounded-xl bg-[#fff4da] px-3 py-2 text-[10px] leading-4 font-bold text-[#815b20]">
                  Premium preview: you can design and save a draft, then upgrade
                  to publish or export it.
                </p>
              ) : null}
            </div>
            {createResume.error && (
              <p
                role="alert"
                className="mt-4 text-sm font-semibold text-[#b64632]"
              >
                We couldn&apos;t create this CV. Please try again.
              </p>
            )}
            <div className="mt-7 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="button-secondary min-h-11"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!title.trim() || createResume.isPending}
                onClick={() => createResume.mutate({ title, template })}
                className="button-primary min-h-11 disabled:opacity-50"
              >
                {createResume.isPending ? "Creating…" : "Create CV"}
              </button>
            </div>
          </div>
        </div>
      )}

      {paywallOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cv-limit-title"
          className="fixed inset-0 z-50 grid place-items-center bg-[#0b2922]/50 p-4 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-xl overflow-hidden rounded-[1.8rem] bg-[#fbfbf8] p-7 shadow-2xl sm:p-10">
            <div className="absolute -top-20 -right-16 size-52 rounded-full bg-[#f2c77c]/25 blur-2xl" />
            <span className="relative grid size-12 place-items-center rounded-2xl bg-[#173f35] text-[#f4c978]">
              <Sparkles size={21} />
            </span>
            <p className="relative mt-6 text-[10px] font-black tracking-[0.2em] text-[#b66b4e] uppercase">
              Free plan · 1 CV per calendar month
            </p>
            <h2
              id="cv-limit-title"
              className="relative mt-2 font-serif text-4xl tracking-[-0.04em] text-[#123f35]"
            >
              Keep the momentum going.
            </h2>
            <p className="relative mt-4 max-w-md text-sm leading-7 text-[#68736e]">
              You&apos;ve used this month&apos;s included CV. Premium unlocks
              unlimited CVs, exclusive templates, and every future premium
              creation tool.
            </p>
            {quota.data?.resetsAt && (
              <p className="relative mt-4 rounded-xl bg-[#eef2ee] px-4 py-3 text-xs font-bold text-[#52605a]">
                Free creation renews on{" "}
                {resetDate.format(new Date(quota.data.resetsAt))}
              </p>
            )}
            <div className="relative mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPaywallOpen(false)}
                className="button-secondary min-h-11"
              >
                Not now
              </button>
              <Link href="/pricing" className="button-primary min-h-11">
                <Crown size={16} />
                See Premium
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getSelectedTemplatePremium(template: ResumeTemplate) {
  return TEMPLATE_DEFINITIONS.find((item) => item.id === template)?.isPremium;
}
