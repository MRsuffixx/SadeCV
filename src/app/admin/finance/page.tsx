import {
  CircleDollarSign,
  CreditCard,
  HeartHandshake,
  Radio,
} from "lucide-react";
import Link from "next/link";

import { formatCurrency } from "~/lib/format";
import { api } from "~/trpc/server";

const dateTime = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AdminFinancePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const requestedPage = Number((await searchParams).page ?? "1");
  const page = Number.isInteger(requestedPage) && requestedPage > 0
    ? requestedPage
    : 1;
  const data = await api.admin.finance({ page, pageSize: 25 });

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="flex items-center gap-4">
        <span className="grid size-12 place-items-center rounded-2xl bg-[#dfece6] text-[#226651]">
          <CircleDollarSign size={23} />
        </span>
        <div>
          <p className="text-xs font-black tracking-[0.15em] text-[#2d7864] uppercase">
            Monetization
          </p>
          <h1 className="mt-1 font-serif text-4xl tracking-[-0.04em] text-[#123f35]">
            Financial operations
          </h1>
        </div>
      </div>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-[#6e7873]">
        Read-only provider transactions, subscription state, donation receipts,
        and webhook processing health.
      </p>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat icon={CreditCard} label="Transactions" value={data.totals.transactions} />
        <MiniStat icon={HeartHandshake} label="Donations" value={data.totals.donations} />
        <MiniStat icon={Radio} label="Webhooks" value={data.totals.webhooks} />
        <MiniStat icon={CircleDollarSign} label="Subscriptions" value={data.totals.subscriptions} />
      </div>

      <FinanceSection title="Transactions" description="Normalized Stripe and iyzico payment ledger.">
        <Table headers={["Provider", "Kind", "Reference", "Amount", "Status", "Occurred"]}>
          {data.transactions.map((item) => (
            <tr key={item.id}>
              <Cell strong>{item.provider}</Cell>
              <Cell>{item.kind}</Cell>
              <Cell mono>{item.providerTransactionId}</Cell>
              <Cell>{item.amount === null ? "—" : formatCurrency(item.amount, item.currency)}</Cell>
              <Cell><Status value={item.status} /></Cell>
              <Cell>{dateTime.format(item.occurredAt)}</Cell>
            </tr>
          ))}
        </Table>
        {!data.transactions.length ? <Empty>No normalized transactions have been received yet.</Empty> : null}
      </FinanceSection>

      <div className="mt-6 grid gap-6 2xl:grid-cols-2">
        <FinanceSection title="Subscriptions" description="Latest synchronized billing contracts.">
          <Table headers={["Customer", "Provider", "Status", "Period end"]}>
            {data.subscriptions.map((item) => (
              <tr key={item.id}>
                <Cell strong>{item.user.name ?? item.user.email}</Cell>
                <Cell>{item.provider}</Cell>
                <Cell><Status value={item.status} /></Cell>
                <Cell>{item.currentPeriodEnd ? dateTime.format(item.currentPeriodEnd) : "—"}</Cell>
              </tr>
            ))}
          </Table>
          {!data.subscriptions.length ? <Empty>No subscriptions yet.</Empty> : null}
        </FinanceSection>
        <FinanceSection title="Donations" description="One-time support payments and failures.">
          <Table headers={["Supporter", "Provider", "Amount", "Status"]}>
            {data.donations.map((item) => (
              <tr key={item.id}>
                <Cell strong>{item.user?.name ?? item.supporterEmail ?? "Guest"}</Cell>
                <Cell>{item.provider}</Cell>
                <Cell>{formatCurrency(item.amount, item.currency)}</Cell>
                <Cell><Status value={item.status} /></Cell>
              </tr>
            ))}
          </Table>
          {!data.donations.length ? <Empty>No donations yet.</Empty> : null}
        </FinanceSection>
      </div>

      <FinanceSection title="Webhook status" description="Idempotent payment events processed by the checkout endpoint.">
        <Table headers={["Provider", "Event", "Event ID", "Attempts", "Status", "Received"]}>
          {data.webhooks.map((item) => (
            <tr key={item.id}>
              <Cell strong>{item.provider}</Cell>
              <Cell>{item.type}</Cell>
              <Cell mono>{item.id}</Cell>
              <Cell>{item.attempts}</Cell>
              <Cell><Status value={item.status} /></Cell>
              <Cell>{dateTime.format(item.createdAt)}</Cell>
            </tr>
          ))}
        </Table>
        {!data.webhooks.length ? <Empty>No webhook events received.</Empty> : null}
      </FinanceSection>

      <nav className="mt-6 flex items-center justify-between rounded-2xl border border-black/[0.07] bg-white p-4 text-xs font-bold">
        <Link
          aria-disabled={data.page <= 1}
          className={data.page <= 1 ? "pointer-events-none opacity-40" : "text-[#24705d]"}
          href={`/admin/finance?page=${Math.max(1, data.page - 1)}`}
        >
          Previous
        </Link>
        <span>Page {data.page} of {data.pageCount}</span>
        <Link
          aria-disabled={data.page >= data.pageCount}
          className={data.page >= data.pageCount ? "pointer-events-none opacity-40" : "text-[#24705d]"}
          href={`/admin/finance?page=${Math.min(data.pageCount, data.page + 1)}`}
        >
          Next
        </Link>
      </nav>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof CreditCard; label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-black/[0.07] bg-white p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-xl bg-[#e7f0eb] text-[#2b725f]"><Icon size={16} /></span>
        <div><p className="text-xl font-black">{value}</p><p className="text-[10px] font-bold text-[#7d8682]">{label} total</p></div>
      </div>
    </article>
  );
}

function FinanceSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="mt-6 overflow-hidden rounded-[1.5rem] border border-black/[0.07] bg-white"><div className="border-b border-black/[0.06] p-5"><h2 className="text-lg font-extrabold">{title}</h2><p className="mt-1 text-xs text-[#7b8580]">{description}</p></div>{children}</section>;
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-[#f5f7f4] text-[9px] font-black tracking-wider text-[#74807a] uppercase"><tr>{headers.map((header) => <th key={header} className="whitespace-nowrap px-5 py-3">{header}</th>)}</tr></thead><tbody className="divide-y divide-black/[0.055]">{children}</tbody></table></div>;
}

function Cell({ children, strong = false, mono = false }: { children: React.ReactNode; strong?: boolean; mono?: boolean }) {
  return <td className={`max-w-[280px] truncate whitespace-nowrap px-5 py-3.5 ${strong ? "font-extrabold" : "text-[#67716c]"} ${mono ? "font-mono text-[10px]" : ""}`}>{children}</td>;
}

function Status({ value }: { value: string }) {
  const good = ["ACTIVE", "TRIALING", "PAID", "SUCCEEDED", "PROCESSED"].includes(value);
  return <span className={`rounded-full px-2 py-1 text-[9px] font-black ${good ? "bg-[#def0e7] text-[#216652]" : "bg-[#f7e4e0] text-[#98483b]"}`}>{value}</span>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="p-8 text-center text-xs font-bold text-[#858e8a]">{children}</p>;
}
