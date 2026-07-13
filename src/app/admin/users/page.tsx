import { UserRoundCog } from "lucide-react";

import { UserTable } from "~/app/admin/users/_components/user-table";

export default function AdminUsersPage() {
  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="flex items-center gap-4">
        <span className="grid size-12 place-items-center rounded-2xl bg-[#dfece6] text-[#226651]">
          <UserRoundCog size={22} />
        </span>
        <div>
          <p className="text-xs font-black tracking-[0.15em] text-[#2d7864] uppercase">
            Directory
          </p>
          <h1 className="mt-1 font-serif text-4xl tracking-[-0.04em] text-[#123f35]">
            User management
          </h1>
        </div>
      </div>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-[#6e7873]">
        Search accounts, inspect history, manage access, and perform audited
        support actions.
      </p>
      <UserTable />
    </div>
  );
}
