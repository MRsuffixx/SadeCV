import Image from "next/image";

import {
  ContactList,
  fontClasses,
  SectionBlock,
  spacingClasses,
  type DomTemplateProps,
} from "~/templates/dom/shared";
import { selectCustomSections, selectPresentationSections } from "~/templates/presentation";

export function ExecutiveDomTemplate({ presentation }: DomTemplateProps) {
  const fonts = fontClasses(presentation);
  const sidebar = selectPresentationSections(presentation, ["skills", "education", "languages", "certifications", "details"]);
  const main = [...selectPresentationSections(presentation, ["summary", "employment", "projects", "awards", "volunteer", "publications", "references", "hobbies"]), ...selectCustomSections(presentation)];
  const showPhoto = presentation.theme.showProfilePhoto && presentation.identity.avatarUrl;
  return (
    <article className={`min-h-full bg-[#fbfbf8] text-[#202824] ${fonts.body} ${spacingClasses(presentation)}`}>
      <header className="relative overflow-hidden px-[7%] pt-[7%] pb-[5%] text-white" style={{ backgroundColor: presentation.theme.accentColor }}>
        <div className="absolute -top-20 -right-16 size-52 rounded-full border-[2rem] border-white/8" />
        <div className="relative flex items-center justify-between gap-[5%]">
          <div className="min-w-0"><p className="text-[clamp(0.4rem,0.8vw,0.56rem)] font-black tracking-[0.22em] text-white/55 uppercase">Executive profile</p><h1 className={`${fonts.heading} mt-[0.7rem] text-[clamp(1.35rem,3.8vw,2.75rem)] leading-[0.95] font-bold tracking-[-0.04em]`}>{presentation.identity.name}</h1><p className="mt-[0.65rem] text-[clamp(0.5rem,1.02vw,0.72rem)] font-bold tracking-[0.12em] text-white/76 uppercase">{presentation.identity.professionalTitle}</p></div>
          {showPhoto ? <Image src={presentation.identity.avatarUrl} alt="" width={96} height={96} unoptimized className="size-[clamp(3.2rem,9vw,6rem)] shrink-0 rounded-full border-4 border-white/25 object-cover" /> : null}
        </div>
        <div className="relative mt-[4%] border-t border-white/18 pt-[2.5%]"><ContactList items={[...presentation.contact, ...presentation.links]} presentation={presentation} inline inverse /></div>
      </header>
      <div className="grid grid-cols-[30%_1fr] gap-[5%] px-[7%] py-[5.5%]">
        <aside className="border-r pr-[12%]" style={{ borderColor: `${presentation.theme.accentColor}35` }}>{sidebar.map((section) => <SectionBlock key={section.id} section={section} presentation={presentation} />)}</aside>
        <main>{main.map((section) => <SectionBlock key={section.id} section={section} presentation={presentation} ruled />)}</main>
      </div>
    </article>
  );
}
