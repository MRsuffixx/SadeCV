"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";

import { api, type RouterOutputs } from "~/trpc/react";

type UserRow = RouterOutputs["admin"]["users"]["items"][number];
const date = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "green" | "red" | "violet" }) {
  const styles = {
    neutral: "bg-[#edf0ed] text-[#65706b]",
    green: "bg-[#def0e7] text-[#216652]",
    red: "bg-[#f8e5e1] text-[#9d4b3d]",
    violet: "bg-[#eee8f8] text-[#6e51a1]",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black tracking-wide uppercase ${styles[tone]}`}>{children}</span>;
}

export function UserTable() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [tier, setTier] = useState("");
  const [accountStatus, setAccountStatus] = useState("");
  const deferredSearch = useDeferredValue(search);
  const query = api.admin.users.useQuery({
    page,
    pageSize: 20,
    search: deferredSearch,
    role: role === "ADMIN" || role === "USER" ? role : undefined,
    tier: tier === "PREMIUM" || tier === "FREE" ? tier : undefined,
    accountStatus:
      accountStatus === "ACTIVE" || accountStatus === "BANNED"
        ? accountStatus
        : undefined,
  });

  const columns = useMemo<ColumnDef<UserRow>[]>(
    () => [
      {
        id: "identity",
        header: "User",
        cell: ({ row }) => (
          <div className="min-w-[220px]">
            <p className="font-extrabold text-[#263b34]">{row.original.name ?? "Unnamed user"}</p>
            <p className="mt-0.5 text-xs text-[#7b8580]">{row.original.email}</p>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => <Badge tone={row.original.role === "ADMIN" ? "violet" : "neutral"}>{row.original.role}</Badge>,
      },
      {
        accessorKey: "tier",
        header: "Plan",
        cell: ({ row }) => <Badge tone={row.original.tier === "PREMIUM" ? "green" : "neutral"}>{row.original.tier}</Badge>,
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <Badge tone={row.original.bannedAt ? "red" : "green"}>{row.original.bannedAt ? "Banned" : "Active"}</Badge>,
      },
      {
        id: "resumes",
        header: "CVs",
        cell: ({ row }) => <span className="font-black text-[#3c5049]">{row.original._count.resumes}</span>,
      },
      {
        accessorKey: "createdAt",
        header: "Joined",
        cell: ({ row }) => <span className="whitespace-nowrap text-xs font-semibold text-[#737d78]">{date.format(row.original.createdAt)}</span>,
      },
      {
        id: "action",
        header: "",
        cell: ({ row }) => (
          <Link href={`/admin/users/${row.original.id}`} className="inline-flex rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-black text-[#246c59] hover:bg-[#edf5f1]">
            Manage
          </Link>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: query.data?.items ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: query.data?.pageCount ?? 1,
  });

  const updateFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <section className="mt-7 overflow-hidden rounded-[1.6rem] border border-black/[0.07] bg-white shadow-[0_18px_60px_rgba(18,63,53,0.05)]">
      <div className="grid gap-3 border-b border-black/[0.07] p-4 lg:grid-cols-[1fr_auto_auto_auto]">
        <label className="relative block">
          <Search className="absolute top-1/2 left-3.5 -translate-y-1/2 text-[#87908c]" size={16} />
          <input
            value={search}
            onChange={(event) => updateFilter(setSearch, event.target.value)}
            placeholder="Search by name or email"
            className="field min-h-11 pl-10"
          />
        </label>
        <FilterSelect label="Role" value={role} onChange={(value) => updateFilter(setRole, value)} options={["USER", "ADMIN"]} />
        <FilterSelect label="Plan" value={tier} onChange={(value) => updateFilter(setTier, value)} options={["FREE", "PREMIUM"]} />
        <FilterSelect label="Account" value={accountStatus} onChange={(value) => updateFilter(setAccountStatus, value)} options={["ACTIVE", "BANNED"]} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-[#f5f7f4] text-[10px] font-black tracking-[0.1em] text-[#737d78] uppercase">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="whitespace-nowrap px-5 py-3.5">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-black/[0.055]">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="transition hover:bg-[#f8faf7]">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-5 py-4">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {query.isLoading ? <p className="py-16 text-center text-sm font-bold text-[#7f8984]">Loading users…</p> : null}
        {!query.isLoading && !query.data?.items.length ? <p className="py-16 text-center text-sm font-bold text-[#7f8984]">No users match these filters.</p> : null}
      </div>

      <div className="flex items-center justify-between border-t border-black/[0.07] px-4 py-3">
        <p className="text-xs font-semibold text-[#77817c]">{query.data ? `${query.data.total} users · Page ${query.data.page} of ${query.data.pageCount}` : "Fetching records"}</p>
        <div className="flex gap-2">
          <button type="button" aria-label="Previous page" disabled={page <= 1 || query.isFetching} onClick={() => setPage((value) => Math.max(1, value - 1))} className="grid size-9 place-items-center rounded-xl border border-black/10 disabled:opacity-35"><ChevronLeft size={16} /></button>
          <button type="button" aria-label="Next page" disabled={!query.data || page >= query.data.pageCount || query.isFetching} onClick={() => setPage((value) => value + 1)} className="grid size-9 place-items-center rounded-xl border border-black/10 disabled:opacity-35"><ChevronRight size={16} /></button>
        </div>
      </div>
    </section>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="relative min-w-36">
      <SlidersHorizontal size={14} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#7f8984]" />
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="field min-h-11 appearance-none pr-8 pl-9 text-xs font-bold">
        <option value="">All {label.toLowerCase()}s</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
