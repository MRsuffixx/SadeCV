import {
  ContactList,
  fontClasses,
  SectionBlock,
  spacingClasses,
  type DomTemplateProps,
} from "~/templates/dom/shared";
import {
  selectCustomSections,
  selectPresentationSections,
} from "~/templates/presentation";

const order = [
  "summary",
  "employment",
  "education",
  "skills",
  "projects",
  "certifications",
  "languages",
  "awards",
  "volunteer",
  "publications",
  "references",
  "hobbies",
  "details",
] as const;

export function AtsDomTemplate({ presentation, definition }: DomTemplateProps) {
  const fonts = fontClasses(presentation);
  const sections = [
    ...selectPresentationSections(presentation, order),
    ...selectCustomSections(presentation),
  ];
  return (
    <article
      className={`min-h-full bg-white p-[7%] text-[#202724] ${fonts.body} ${spacingClasses(presentation)} ${
        definition.id === "MONO" ? "font-mono" : ""
      }`}
    >
      <header className="border-b-2 pb-[3.2%]" style={{ borderColor: presentation.theme.accentColor }}>
        <h1 className={`${fonts.heading} text-[clamp(1.3rem,3.7vw,2.65rem)] leading-none font-black tracking-[-0.04em]`}>
          {presentation.identity.name}
        </h1>
        <p className="mt-[1.6%] text-[clamp(0.48rem,1vw,0.72rem)] font-black tracking-[0.14em] uppercase" style={{ color: presentation.theme.accentColor }}>
          {presentation.identity.professionalTitle}
        </p>
        <div className="mt-[2.3%]"><ContactList items={[...presentation.contact, ...presentation.links]} presentation={presentation} inline /></div>
      </header>
      <main className="pt-[4%]">
        {sections.map((section) => <SectionBlock key={section.id} section={section} presentation={presentation} ruled />)}
      </main>
    </article>
  );
}
