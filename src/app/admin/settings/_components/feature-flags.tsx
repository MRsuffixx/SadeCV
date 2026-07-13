"use client";

import {
  AlertTriangle,
  FileDown,
  LoaderCircle,
  Power,
  UserPlus,
} from "lucide-react";

import { api, type RouterOutputs } from "~/trpc/react";

type Flag = RouterOutputs["admin"]["settings"][number];
const icons = {
  MAINTENANCE_MODE: AlertTriangle,
  PDF_GENERATION: FileDown,
  REGISTRATION: UserPlus,
} as const;
const labels = {
  MAINTENANCE_MODE: "Maintenance mode",
  PDF_GENERATION: "PDF generation",
  REGISTRATION: "New registrations",
} as const;

export function FeatureFlags({ initialFlags }: { initialFlags: Flag[] }) {
  const utils = api.useUtils();
  const { data: flags = initialFlags } = api.admin.settings.useQuery(
    undefined,
    { initialData: initialFlags },
  );
  const mutation = api.admin.updateFeatureFlag.useMutation({
    onMutate: async (input) => {
      await utils.admin.settings.cancel();
      const previous = utils.admin.settings.getData();
      utils.admin.settings.setData(undefined, (current) =>
        current?.map((flag) =>
          flag.key === input.key ? { ...flag, enabled: input.enabled } : flag,
        ),
      );
      return { previous };
    },
    onError: (_error, _input, context) =>
      utils.admin.settings.setData(undefined, context?.previous),
    onSettled: () => utils.admin.settings.invalidate(),
  });

  return (
    <div className="mt-7 space-y-4">
      {flags.map((flag) => {
        const Icon = icons[flag.key];
        const pending =
          mutation.isPending && mutation.variables?.key === flag.key;
        return (
          <section
            key={flag.key}
            className="flex flex-col gap-5 rounded-[1.5rem] border border-black/[0.07] bg-white p-5 shadow-[0_12px_40px_rgba(18,63,53,0.035)] sm:flex-row sm:items-center"
          >
            <span
              className={`grid size-12 shrink-0 place-items-center rounded-2xl ${flag.enabled ? "bg-[#dff0e8] text-[#236b57]" : "bg-[#f4e6e2] text-[#9c4a3c]"}`}
            >
              <Icon size={21} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-extrabold">{labels[flag.key]}</h2>
                <span
                  className={`rounded-full px-2 py-1 text-[9px] font-black ${flag.enabled ? "bg-[#e2f1ea] text-[#246853]" : "bg-[#f5e5e1] text-[#97483b]"}`}
                >
                  {flag.enabled ? "ENABLED" : "DISABLED"}
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-5 text-[#747e79]">
                {flag.description}
              </p>
              <p className="mt-2 font-mono text-[9px] text-[#a0a7a3]">
                {flag.key}
              </p>
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                mutation.mutate({ key: flag.key, enabled: !flag.enabled })
              }
              aria-label={`${flag.enabled ? "Disable" : "Enable"} ${labels[flag.key]}`}
              className={`relative h-8 w-14 shrink-0 rounded-full transition ${flag.enabled ? "bg-[#277b67]" : "bg-[#c9cecb]"}`}
            >
              <span
                className={`absolute top-1 grid size-6 place-items-center rounded-full bg-white shadow transition ${flag.enabled ? "left-7" : "left-1"}`}
              >
                {pending ? (
                  <LoaderCircle
                    className="animate-spin text-[#60706a]"
                    size={11}
                  />
                ) : (
                  <Power className="text-[#60706a]" size={11} />
                )}
              </span>
            </button>
          </section>
        );
      })}
      {mutation.error ? (
        <p
          role="alert"
          className="rounded-xl border border-[#e8c0b8] bg-[#fff4f1] p-4 text-xs font-bold text-[#a24c3d]"
        >
          {mutation.error.message}
        </p>
      ) : null}
    </div>
  );
}
