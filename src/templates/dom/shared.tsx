import type { ReactNode } from "react";

import type {
  PresentationContact,
  PresentationItem,
  PresentationSection,
  ResumePresentation,
} from "~/templates/presentation";
import type { ResumeTemplateDefinition } from "~/templates/schema";

export type DomTemplateProps = {
  presentation: ResumePresentation;
  definition: ResumeTemplateDefinition;
};

export function fontClasses(presentation: ResumePresentation) {
  switch (presentation.theme.fontPairing) {
    case "CLASSIC_SERIF":
      return { body: "font-serif", heading: "font-serif" };
    case "EDITORIAL_SERIF":
      return { body: "font-sans", heading: "font-serif" };
    default:
      return { body: "font-sans", heading: "font-sans" };
  }
}

export function spacingClasses(presentation: ResumePresentation) {
  return {
    COMPACT: "[--cv-section-gap:0.8rem] [--cv-item-gap:0.48rem] leading-[1.35]",
    BALANCED: "[--cv-section-gap:1.15rem] [--cv-item-gap:0.72rem] leading-[1.5]",
    SPACIOUS: "[--cv-section-gap:1.55rem] [--cv-item-gap:0.95rem] leading-[1.65]",
  }[presentation.theme.spacing];
}

export function ContactList({
  items,
  presentation,
  inline = false,
  inverse = false,
}: {
  items: PresentationContact[];
  presentation: ResumePresentation;
  inline?: boolean;
  inverse?: boolean;
}) {
  return (
    <div
      className={
        inline
          ? "flex flex-wrap gap-x-[0.7rem] gap-y-[0.25rem]"
          : "space-y-[0.32rem]"
      }
    >
      {items.map((item) => (
        <p
          key={item.id}
          className={`flex min-w-0 items-start gap-[0.35rem] break-all text-[clamp(0.38rem,0.8vw,0.57rem)] ${
            inverse ? "text-white/80" : "text-[#64706b]"
          }`}
        >
          {presentation.theme.showIcons ? (
            <span
              aria-hidden
              className={`mt-[0.32em] size-[0.3rem] shrink-0 rounded-full ${
                inverse ? "bg-white/65" : ""
              }`}
              style={
                inverse
                  ? undefined
                  : { backgroundColor: presentation.theme.accentColor }
              }
            />
          ) : null}
          <span>{item.value}</span>
        </p>
      ))}
    </div>
  );
}

export function SectionBlock({
  section,
  presentation,
  children,
  inverse = false,
  ruled = false,
}: {
  section: PresentationSection;
  presentation: ResumePresentation;
  children?: ReactNode;
  inverse?: boolean;
  ruled?: boolean;
}) {
  return (
    <section className="mb-[var(--cv-section-gap)] break-inside-avoid">
      <div
        className={`mb-[0.5rem] flex items-center gap-[0.45rem] ${
          ruled ? "border-b pb-[0.35rem]" : ""
        }`}
        style={ruled ? { borderColor: `${presentation.theme.accentColor}55` } : undefined}
      >
        {presentation.theme.showIcons ? (
          <span
            className={`size-[0.38rem] shrink-0 rounded-sm ${inverse ? "bg-white/70" : ""}`}
            style={inverse ? undefined : { backgroundColor: presentation.theme.accentColor }}
          />
        ) : null}
        <h2
          className={`text-[clamp(0.48rem,0.98vw,0.7rem)] font-black tracking-[0.14em] uppercase ${
            inverse ? "text-white" : ""
          }`}
          style={inverse ? undefined : { color: presentation.theme.accentColor }}
        >
          {section.title}
        </h2>
      </div>
      {children ?? <SectionItems section={section} presentation={presentation} inverse={inverse} />}
    </section>
  );
}

export function SectionItems({
  section,
  presentation,
  inverse = false,
  numbered = false,
}: {
  section: PresentationSection;
  presentation: ResumePresentation;
  inverse?: boolean;
  numbered?: boolean;
}) {
  if (section.kind === "SKILLS") {
    return (
      <div className="space-y-[var(--cv-item-gap)]">
        {section.items.map((item) => (
          <SkillItem key={item.id} item={item} presentation={presentation} inverse={inverse} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-[var(--cv-item-gap)]">
      {section.items.map((item, index) => (
        <ItemBlock
          key={item.id}
          item={item}
          presentation={presentation}
          inverse={inverse}
          number={numbered ? index + 1 : undefined}
        />
      ))}
    </div>
  );
}

export function ItemBlock({
  item,
  presentation,
  inverse = false,
  number,
}: {
  item: PresentationItem;
  presentation: ResumePresentation;
  inverse?: boolean;
  number?: number;
}) {
  return (
    <article className="break-inside-avoid">
      <div className="flex items-start gap-[0.55rem]">
        {number ? (
          <span
            className="mt-[0.08rem] text-[clamp(0.38rem,0.76vw,0.54rem)] font-black"
            style={{ color: presentation.theme.accentColor }}
          >
            {String(number).padStart(2, "0")}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-[0.7rem]">
            <div className="min-w-0">
              {item.title ? (
                <h3
                  className={`text-[clamp(0.54rem,1.08vw,0.78rem)] leading-tight font-extrabold ${
                    inverse ? "text-white" : "text-[#26302c]"
                  }`}
                >
                  {item.title}
                </h3>
              ) : null}
              {item.subtitle ? (
                <p
                  className={`mt-[0.16rem] text-[clamp(0.42rem,0.85vw,0.61rem)] font-bold ${
                    inverse ? "text-white/72" : ""
                  }`}
                  style={inverse ? undefined : { color: presentation.theme.accentColor }}
                >
                  {item.subtitle}
                </p>
              ) : null}
            </div>
            {item.meta ? (
              <p
                className={`max-w-[43%] shrink-0 text-right text-[clamp(0.34rem,0.7vw,0.5rem)] leading-snug font-semibold ${
                  inverse ? "text-white/55" : "text-[#7b8580]"
                }`}
              >
                {item.meta}
              </p>
            ) : null}
          </div>
          {item.body.map((paragraph, index) => (
            <p
              key={`${item.id}-body-${index}`}
              className={`mt-[0.32rem] whitespace-pre-line text-[clamp(0.42rem,0.84vw,0.6rem)] ${
                inverse ? "text-white/72" : "text-[#59635e]"
              }`}
            >
              {paragraph}
            </p>
          ))}
          {item.tags.length ? (
            <div className="mt-[0.35rem] flex flex-wrap gap-[0.25rem]">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className={`rounded-full px-[0.38rem] py-[0.16rem] text-[clamp(0.3rem,0.62vw,0.44rem)] font-bold ${
                    inverse ? "bg-white/12 text-white/70" : "bg-[#eef2ef] text-[#59645f]"
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function SkillItem({
  item,
  presentation,
  inverse = false,
}: {
  item: PresentationItem;
  presentation: ResumePresentation;
  inverse?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className={`text-[clamp(0.42rem,0.86vw,0.61rem)] font-extrabold ${inverse ? "text-white" : "text-[#35413c]"}`}>
          {item.title}
        </p>
        {item.meta ? <p className={`text-[clamp(0.3rem,0.62vw,0.44rem)] ${inverse ? "text-white/55" : "text-[#7a847f]"}`}>{item.meta}</p> : null}
      </div>
      {item.progress ? (
        <div className={`mt-[0.25rem] h-[0.2rem] overflow-hidden rounded-full ${inverse ? "bg-white/15" : "bg-[#e2e8e4]"}`}>
          <div
            className={`h-full rounded-full ${inverse ? "bg-white/70" : ""}`}
            style={{
              width: `${item.progress}%`,
              ...(inverse ? {} : { backgroundColor: presentation.theme.accentColor }),
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
