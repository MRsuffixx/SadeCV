import { ContactList, fontClasses, SectionBlock, SectionItems, spacingClasses, type DomTemplateProps } from "~/templates/dom/shared";
import { selectCustomSections, selectPresentationSections } from "~/templates/presentation";

const academicOrder = ["summary", "education", "publications", "employment", "projects", "awards", "certifications", "volunteer", "skills", "languages", "references", "hobbies", "details"] as const;

export function AcademicDomTemplate({ presentation, definition }: DomTemplateProps) {
  const fonts = fontClasses(presentation);
  const sections = [...selectPresentationSections(presentation, academicOrder), ...selectCustomSections(presentation)];
  return (
    <article className={`min-h-full bg-[#fffefa] p-[7%_8%] text-[#292c2a] ${fonts.body} ${spacingClasses(presentation)}`}>
      <header className="text-center">
        <p className="text-[clamp(0.36rem,0.72vw,0.52rem)] font-black tracking-[0.22em] uppercase" style={{ color: presentation.theme.accentColor }}>{definition.id === "EDITORIAL" ? "Curriculum vitae" : "Academic curriculum vitae"}</p>
        <h1 className={`${fonts.heading} mt-[0.7rem] text-[clamp(1.3rem,3.7vw,2.65rem)] font-bold tracking-[-0.035em]`}>{presentation.identity.name}</h1>
        <p className="mt-[0.3rem] text-[clamp(0.46rem,0.94vw,0.68rem)] italic text-[#68716d]">{presentation.identity.professionalTitle}</p>
        <div className="mx-auto mt-[2.5%] flex max-w-[88%] justify-center"><ContactList items={[...presentation.contact, ...presentation.links]} presentation={presentation} inline /></div>
        <div className="mx-auto mt-[3.4%] h-px w-[72%]" style={{ backgroundColor: presentation.theme.accentColor }} />
      </header>
      <main className="mt-[5%]">
        {sections.map((section) => (
          <SectionBlock key={section.id} section={section} presentation={presentation} ruled>
            <SectionItems section={section} presentation={presentation} numbered={section.id === "publications"} />
          </SectionBlock>
        ))}
      </main>
      <footer className="mt-[5%] border-t pt-[1.5%] text-center text-[clamp(0.3rem,0.6vw,0.44rem)] text-[#929994]" style={{ borderColor: `${presentation.theme.accentColor}55` }}>SadeCV · Comprehensive academic format</footer>
    </article>
  );
}
