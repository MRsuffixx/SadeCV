"use client";

import { ChevronLeft, ChevronRight, Search, Trash2, X } from "lucide-react";
import { useDeferredValue, useState } from "react";

import { api, type RouterOutputs } from "~/trpc/react";

type ResumeRow = RouterOutputs["admin"]["resumes"]["items"][number];
const date = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

export function ResumeModeration() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [target, setTarget] = useState<ResumeRow | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const deferredSearch = useDeferredValue(search);
  const utils = api.useUtils();
  const query = api.admin.resumes.useQuery({
    page,
    pageSize: 20,
    search: deferredSearch,
    status: ["DRAFT", "READY", "ARCHIVED"].includes(status)
      ? (status as "DRAFT" | "READY" | "ARCHIVED")
      : undefined,
  });
  const remove = api.admin.deleteResume.useMutation({
    onSuccess: async () => {
      setTarget(null);
      setConfirmation("");
      await Promise.all([
        utils.admin.resumes.invalidate(),
        utils.admin.overview.invalidate(),
      ]);
    },
  });

  return (
    <>
      <section className="mt-7 overflow-hidden rounded-[1.6rem] border border-black/[0.07] bg-white">
        <div className="grid gap-3 border-b border-black/[0.06] p-4 sm:grid-cols-[1fr_180px]">
          <label className="relative">
            <Search
              className="absolute top-1/2 left-3.5 -translate-y-1/2 text-[#87908c]"
              size={16}
            />
            <input
              className="field pl-10"
              placeholder="Search title or owner email"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <select
            className="field text-xs font-bold"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option>DRAFT</option>
            <option>READY</option>
            <option>ARCHIVED</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f5f7f4] text-[9px] font-black tracking-wider text-[#74807a] uppercase">
              <tr>
                {["Resume", "Owner", "Template", "Status", "Created", ""].map(
                  (header) => (
                    <th key={header} className="px-5 py-3">
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.055]">
              {query.data?.items.map((resume) => (
                <tr key={resume.id} className="hover:bg-[#f8faf7]">
                  <td className="min-w-[220px] px-5 py-4">
                    <p className="font-extrabold">{resume.title}</p>
                    <p className="mt-0.5 font-mono text-[9px] text-[#919995]">
                      {resume.id}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold">{resume.user.name ?? "Unnamed"}</p>
                    <p className="mt-0.5 text-[10px] text-[#7d8682]">
                      {resume.user.email}
                    </p>
                  </td>
                  <td className="px-5 py-4 font-bold text-[#52615b]">
                    {resume.template}
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-[#e8efeb] px-2 py-1 text-[9px] font-black">
                      {resume.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-[#6f7974]">
                    {date.format(resume.createdAt)}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => setTarget(resume)}
                      className="grid size-9 place-items-center rounded-xl border border-[#e6c1ba] text-[#9a493c]"
                      aria-label={`Delete ${resume.title}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {query.isLoading ? (
          <p className="py-16 text-center text-sm font-bold text-[#828b87]">
            Loading resumes…
          </p>
        ) : null}
        {!query.isLoading && !query.data?.items.length ? (
          <p className="py-16 text-center text-sm font-bold text-[#828b87]">
            No resumes match.
          </p>
        ) : null}
        <div className="flex items-center justify-between border-t border-black/[0.06] p-4">
          <p className="text-xs text-[#747e79]">
            {query.data
              ? `${query.data.total} resumes · Page ${query.data.page} of ${query.data.pageCount}`
              : "Fetching"}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="grid size-9 place-items-center rounded-xl border border-black/10 disabled:opacity-35"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={!query.data || page >= query.data.pageCount}
              onClick={() => setPage((value) => value + 1)}
              className="grid size-9 place-items-center rounded-xl border border-black/10 disabled:opacity-35"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {target ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#0c241e]/65 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-[1.6rem] bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-black tracking-wider text-[#a24d3e] uppercase">
                  Permanent action
                </p>
                <h2 className="mt-1 text-xl font-extrabold">
                  Delete “{target.title}”?
                </h2>
              </div>
              <button
                onClick={() => setTarget(null)}
                className="grid size-9 place-items-center rounded-xl border border-black/10"
              >
                <X size={16} />
              </button>
            </div>
            <p className="mt-3 text-xs leading-5 text-[#707a75]">
              Type the exact resume title. The owner’s remaining account data
              will not be affected.
            </p>
            <input
              autoFocus
              className="field mt-4"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder={target.title}
            />
            {remove.error ? (
              <p className="mt-3 text-xs font-bold text-[#a34d3e]">
                {remove.error.message}
              </p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setTarget(null)}
                className="button-secondary min-h-10 rounded-xl px-4 text-xs"
              >
                Cancel
              </button>
              <button
                disabled={confirmation !== target.title || remove.isPending}
                onClick={() =>
                  remove.mutate({
                    resumeId: target.id,
                    confirmationTitle: confirmation,
                  })
                }
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#963f32] px-4 text-xs font-black text-white disabled:opacity-35"
              >
                <Trash2 size={14} />
                Delete resume
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
