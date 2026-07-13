"use client";

import { Crown } from "lucide-react";
import { useMemo } from "react";

import { useResumeStore } from "~/app/dash/resumes/[resumeId]/_store/resume-store";
import { DomTemplateRenderer } from "~/templates/dom/template-renderer";
import { buildResumePresentation } from "~/templates/presentation";
import { getTemplateDefinition } from "~/templates/registry";

export function ResumePreview({ isPremium }: { isPremium: boolean }) {
  const content = useResumeStore((state) => state.content);
  const selectedTemplateId = useResumeStore(
    (state) => state.selectedTemplateId,
  );
  const theme = useResumeStore((state) => state.theme);
  const definition = getTemplateDefinition(selectedTemplateId);
  const presentation = useMemo(
    () => buildResumePresentation(content, theme, { placeholders: true }),
    [content, theme],
  );
  const previewOnly = definition.isPremium && !isPremium;

  return (
    <section className="min-w-0 bg-[#dce2dc] p-4 sm:p-7 lg:sticky lg:top-[72px] lg:h-[calc(100vh-72px)] lg:overflow-y-auto">
      <div className="mx-auto mb-3 flex w-full max-w-[820px] items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black tracking-[0.13em] text-[#66716c] uppercase">
            {definition.category} template
          </p>
          <p className="mt-0.5 text-xs font-extrabold text-[#2c4038]">
            {definition.name}
          </p>
        </div>
        {previewOnly ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff5dd] px-3 py-1.5 text-[9px] font-black text-[#8c6224] uppercase shadow-sm">
            <Crown size={11} /> Premium preview
          </span>
        ) : null}
      </div>
      <div className="relative mx-auto aspect-[210/297] w-full max-w-[820px] overflow-hidden bg-white shadow-[0_30px_90px_rgba(28,48,40,0.18)]">
        <DomTemplateRenderer
          presentation={presentation}
          definition={definition}
        />
        {previewOnly ? <PremiumWatermark /> : null}
      </div>
      {definition.renderer === "ACADEMIC" ? (
        <p className="mx-auto mt-3 max-w-[820px] text-center text-[10px] font-semibold text-[#727d77]">
          Long academic content automatically continues onto additional PDF
          pages.
        </p>
      ) : null}
    </section>
  );
}

function PremiumWatermark() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 grid grid-cols-2 content-around overflow-hidden bg-white/[0.025]"
    >
      {Array.from({ length: 8 }, (_, index) => (
        <span
          key={index}
          className="-rotate-[28deg] text-center text-[clamp(0.65rem,1.8vw,1.25rem)] font-black tracking-[0.22em] whitespace-nowrap text-[#7f5f25]/16 uppercase"
        >
          SadeCV Premium
        </span>
      ))}
    </div>
  );
}
