import { Settings2 } from "lucide-react";

import { FeatureFlags } from "~/app/admin/settings/_components/feature-flags";
import { api } from "~/trpc/server";

export default async function AdminSettingsPage() {
  const flags = await api.admin.settings();
  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="flex items-center gap-4">
        <span className="grid size-12 place-items-center rounded-2xl bg-[#dfece6] text-[#226651]">
          <Settings2 size={22} />
        </span>
        <div>
          <p className="text-xs font-black tracking-[0.15em] text-[#2d7864] uppercase">
            Control plane
          </p>
          <h1 className="mt-1 font-serif text-4xl tracking-[-0.04em] text-[#123f35]">
            System settings
          </h1>
        </div>
      </div>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-[#6e7873]">
        Global operational switches take effect server-side and are written to
        the admin audit trail.
      </p>
      <FeatureFlags initialFlags={flags} />
      <section className="mt-6 rounded-[1.5rem] border border-[#d8b99a] bg-[#fff8ee] p-5">
        <p className="text-xs font-black tracking-wider text-[#916036] uppercase">
          Operational caution
        </p>
        <p className="mt-2 text-xs leading-5 text-[#756252]">
          Maintenance mode excludes administrators so the control plane remains
          reachable. Registration and PDF checks are independently enforced at
          the server boundary.
        </p>
      </section>
    </div>
  );
}
