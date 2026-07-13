import Image from "next/image";

import { ContactList, fontClasses, SectionBlock, spacingClasses, type DomTemplateProps } from "~/templates/dom/shared";
import { selectCustomSections, selectPresentationSections } from "~/templates/presentation";

export function StudioDomTemplate({ presentation }: DomTemplateProps) {
  const fonts = fontClasses(presentation);
  const sidebar = selectPresentationSections(presentation, ["skills", "languages", "education", "certifications", "hobbies", "details"]);
  const main = [...selectPresentationSections(presentation, ["summary", "employment", "projects", "awards", "volunteer", "publications", "references"]), ...selectCustomSections(presentation)];
  const showPhoto = presentation.theme.showProfilePhoto && presentation.identity.avatarUrl;
  return (
    <article className={`grid min-h-full grid-cols-[34%_1fr] bg-white text-[#202824] ${fonts.body} ${spacingClasses(presentation)}`}>
      <aside className="relative overflow-hidden p-[12%_10%] text-white" style={{ backgroundColor: presentation.theme.accentColor }}>
        <div className="absolute -top-10 -left-10 size-32 rotate-12 border-[1.2rem] border-white/10" />
        <div className="relative">
          {showPhoto ? <Image src={presentation.identity.avatarUrl} alt="" width={150} height={150} unoptimized className="aspect-square w-[72%] rounded-[28%_8%_28%_8%] border-4 border-white/22 object-cover" /> : <div className="grid aspect-square w-[58%] place-items-center rounded-[28%_8%_28%_8%] bg-white/12 text-[clamp(1.2rem,4vw,2.8rem)] font-black">{presentation.identity.name.slice(0, 1)}</div>}
          <div className="mt-[14%]"><h1 className={`${fonts.heading} text-[clamp(1.1rem,3.2vw,2.25rem)] leading-[0.95] font-black tracking-[-0.04em]`}>{presentation.identity.name}</h1><p className="mt-[0.7rem] text-[clamp(0.42rem,0.9vw,0.64rem)] font-black tracking-[0.16em] text-white/65 uppercase">{presentation.identity.professionalTitle}</p></div>
          <div className="mt-[12%]"><p className="mb-[0.55rem] text-[clamp(0.38rem,0.74vw,0.52rem)] font-black tracking-[0.15em] text-white/55 uppercase">Connect</p><ContactList items={[...presentation.contact, ...presentation.links]} presentation={presentation} inverse /></div>
          <div className="mt-[13%]">{sidebar.map((section) => <SectionBlock key={section.id} section={section} presentation={presentation} inverse />)}</div>
        </div>
      </aside>
      <main className="p-[8%_7%]">
        <div className="mb-[9%] flex items-center gap-3"><span className="h-[0.3rem] w-[18%] rounded-full" style={{ backgroundColor: presentation.theme.accentColor }} /><span className="text-[clamp(0.36rem,0.7vw,0.5rem)] font-black tracking-[0.2em] text-[#89928d] uppercase">Selected work & experience</span></div>
        {main.map((section) => <SectionBlock key={section.id} section={section} presentation={presentation} ruled />)}
      </main>
    </article>
  );
}
