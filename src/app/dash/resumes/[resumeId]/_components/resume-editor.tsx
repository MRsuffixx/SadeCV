"use client";

import { ArrowLeft, Check, Download, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { api } from "~/trpc/react";

type Experience = { id: string; role: string; company: string; period: string; description: string };
type Content = {
  basics: { name: string; email: string; headline: string; summary: string };
  experience: Experience[];
  education: { id: string; school: string; degree: string; period: string }[];
  skills: string[];
};
type ResumeRecord = { id: string; title: string; template: string; accentColor: string; contentJson: string; status: string; isPublic: boolean };

const fallback: Content = {
  basics: { name: "", email: "", headline: "", summary: "" },
  experience: [],
  education: [],
  skills: [],
};

function readContent(value: string): Content {
  try {
    const parsed = JSON.parse(value) as Partial<Content>;
    return { ...fallback, ...parsed, basics: { ...fallback.basics, ...parsed.basics }, experience: parsed.experience ?? [], education: parsed.education ?? [], skills: parsed.skills ?? [] };
  } catch {
    return fallback;
  }
}

export function ResumeEditor({ resume }: { resume: ResumeRecord }) {
  const [title, setTitle] = useState(resume.title);
  const [template, setTemplate] = useState<"ATLAS" | "MONO" | "EDITORIAL">(resume.template as "ATLAS" | "MONO" | "EDITORIAL");
  const [accentColor, setAccentColor] = useState(resume.accentColor);
  const [isPublic, setIsPublic] = useState(resume.isPublic);
  const [content, setContent] = useState<Content>(() => readContent(resume.contentJson));
  const [saved, setSaved] = useState(true);
  const mutation = api.resume.update.useMutation({ onSuccess: () => setSaved(true) });

  const basic = (field: keyof Content["basics"], value: string) => {
    setSaved(false);
    setContent((current) => ({ ...current, basics: { ...current.basics, [field]: value } }));
  };
  const experience = (id: string, field: keyof Omit<Experience, "id">, value: string) => {
    setSaved(false);
    setContent((current) => ({ ...current, experience: current.experience.map((item) => item.id === id ? { ...item, [field]: value } : item) }));
  };
  const save = () => mutation.mutate({
    id: resume.id, title, template, accentColor, isPublic,
    contentJson: JSON.stringify(content),
    status: content.basics.name && content.basics.headline ? "READY" : "DRAFT",
  });

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#e8ebe6]">
      <div className="border-b border-black/[0.08] bg-[#fbfbf8] px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/dash" aria-label="Back to dashboard" className="grid size-9 shrink-0 place-items-center rounded-xl border border-black/10 bg-white text-[#66706b]"><ArrowLeft size={17} /></Link>
            <div className="min-w-0">
              <input aria-label="CV title" value={title} maxLength={120} onChange={(event) => { setTitle(event.target.value); setSaved(false); }} className="w-full truncate bg-transparent text-sm font-extrabold outline-none" />
              <p className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-[#8b928e]">{saved ? <><Check size={11} className="text-[#2b806a]" />All changes saved</> : "Unsaved changes"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="hidden items-center gap-2 rounded-full bg-[#edf1ee] px-3 py-2 text-xs font-bold text-[#65706b] sm:flex"><input type="checkbox" checked={isPublic} onChange={(event) => { setIsPublic(event.target.checked); setSaved(false); }} className="accent-[#277b67]" />Shareable</label>
            <button type="button" onClick={() => window.print()} className="button-secondary min-h-9 px-3 text-xs"><Download size={15} /><span className="hidden sm:inline">Export</span></button>
            <button type="button" onClick={save} disabled={mutation.isPending || saved} className="button-primary min-h-9 px-4 text-xs disabled:opacity-50"><Save size={15} />{mutation.isPending ? "Saving…" : "Save"}</button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[430px_1fr]">
        <section className="max-h-[calc(100vh-133px)] overflow-y-auto border-r border-black/[0.08] bg-[#f8f8f5] p-4 sm:p-6">
          <p className="eyebrow text-[#277b67]">Content</p>
          <h1 className="mb-5 mt-2 font-serif text-2xl text-[#123f35]">Shape your story.</h1>
          <div className="space-y-4">
            <Panel title="Profile" description="The essentials at a glance.">
              <div className="space-y-3">
                <Field label="Full name" value={content.basics.name} onChange={(value) => basic("name", value)} placeholder="Alex Morgan" />
                <Field label="Professional headline" value={content.basics.headline} onChange={(value) => basic("headline", value)} placeholder="Product designer & systems thinker" />
                <Field label="Email" type="email" value={content.basics.email} onChange={(value) => basic("email", value)} placeholder="alex@example.com" />
                <label className="block"><span className="field-label">Professional summary</span><textarea className="field min-h-28 resize-y" value={content.basics.summary} onChange={(event) => basic("summary", event.target.value)} placeholder="A concise view of your strengths, focus, and impact." maxLength={900} /></label>
              </div>
            </Panel>

            <Panel title="Experience" description="Show impact, not just activity.">
              <div className="space-y-4">
                {content.experience.map((item, index) => (
                  <div key={item.id} className="rounded-2xl border border-black/[0.08] bg-[#fafbf8] p-4">
                    <div className="mb-3 flex items-center justify-between"><span className="text-[10px] font-extrabold uppercase tracking-wider text-[#7a837e]">Role {index + 1}</span><button type="button" aria-label="Remove experience" onClick={() => { setSaved(false); setContent((current) => ({ ...current, experience: current.experience.filter((entry) => entry.id !== item.id) })); }} className="text-[#9b6860]"><Trash2 size={14} /></button></div>
                    <div className="space-y-3">
                      <Field label="Role" value={item.role} onChange={(value) => experience(item.id, "role", value)} placeholder="Design Lead" />
                      <Field label="Company" value={item.company} onChange={(value) => experience(item.id, "company", value)} placeholder="Northstar Labs" />
                      <Field label="Period" value={item.period} onChange={(value) => experience(item.id, "period", value)} placeholder="2022—Present" />
                      <label className="block"><span className="field-label">Impact</span><textarea className="field min-h-24 resize-y" value={item.description} onChange={(event) => experience(item.id, "description", event.target.value)} placeholder="What changed because of your work?" maxLength={1200} /></label>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => { setSaved(false); setContent((current) => ({ ...current, experience: [...current.experience, { id: crypto.randomUUID(), role: "", company: "", period: "", description: "" }] })); }} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#277b67]/30 bg-[#edf5f1] px-4 py-3 text-xs font-extrabold text-[#246451]"><Plus size={15} />Add experience</button>
              </div>
            </Panel>

            <Panel title="Skills" description="A concise signal of your range.">
              <label className="block"><span className="field-label">Skills, separated by commas</span><textarea className="field min-h-24 resize-y" value={content.skills.join(", ")} onChange={(event) => { setSaved(false); setContent((current) => ({ ...current, skills: event.target.value.split(",").map((skill) => skill.trim()).filter(Boolean) })); }} placeholder="Product strategy, Research, Figma" /></label>
            </Panel>

            <Panel title="Visual style" description="Keep it recognizably yours.">
              <span className="field-label">Template</span>
              <div className="grid grid-cols-3 gap-2">{(["ATLAS", "MONO", "EDITORIAL"] as const).map((value) => <button key={value} type="button" onClick={() => { setTemplate(value); setSaved(false); }} className={`rounded-xl border px-2 py-2.5 text-[10px] font-extrabold ${template === value ? "border-[#277b67] bg-[#e4f1eb] text-[#1d5e4d]" : "border-black/10 bg-white text-[#78807c]"}`}>{value}</button>)}</div>
              <span className="field-label mt-4">Accent color</span>
              <div className="flex gap-2">{["#0F766E", "#1E3A5F", "#7C3F58", "#4E5D3D", "#202020"].map((color) => <button key={color} type="button" onClick={() => { setAccentColor(color); setSaved(false); }} aria-label={`Use accent color ${color}`} className={`size-8 rounded-full border-2 border-white shadow ${accentColor === color ? "ring-2 ring-[#ef765f] ring-offset-2" : ""}`} style={{ backgroundColor: color }} />)}</div>
            </Panel>
          </div>
        </section>

        <section className="grid min-h-[calc(100vh-133px)] place-items-center overflow-auto p-5 sm:p-10">
          <div className={`cv-print-area aspect-[0.707] w-full max-w-[720px] bg-white shadow-[0_35px_90px_rgba(18,63,53,0.17)] ${template === "MONO" ? "font-mono" : ""}`}>
            <div className="p-[8%]">
              <header className={template === "EDITORIAL" ? "border-l-4 pl-6" : "border-b-2 pb-6"} style={{ borderColor: accentColor }}>
                <h2 className="font-serif text-[clamp(2rem,5vw,4rem)] leading-none tracking-[-0.045em]" style={{ color: accentColor }}>{content.basics.name || "Your name"}</h2>
                <p className="mt-3 text-[clamp(0.6rem,1.4vw,0.9rem)] font-extrabold uppercase tracking-[0.2em] text-[#d65e48]">{content.basics.headline || "Your professional headline"}</p>
              </header>
              <div className="grid grid-cols-[0.31fr_0.69fr] gap-[7%] pt-8">
                <aside>
                  <Heading color={accentColor}>Contact</Heading><p className="mt-3 break-all text-[clamp(0.55rem,1.2vw,0.78rem)] leading-6 text-[#68716d]">{content.basics.email || "you@example.com"}</p>
                  <Heading color={accentColor} className="mt-8">Skills</Heading><div className="mt-3 flex flex-wrap gap-1.5">{(content.skills.length ? content.skills : ["Your", "Key", "Skills"]).map((skill) => <span key={skill} className="rounded-full bg-[#eef2ef] px-2 py-1 text-[clamp(0.45rem,1vw,0.67rem)] font-bold text-[#52605a]">{skill}</span>)}</div>
                </aside>
                <div>
                  <Heading color={accentColor}>Profile</Heading><p className="mt-3 text-[clamp(0.55rem,1.2vw,0.78rem)] leading-[1.8] text-[#59625e]">{content.basics.summary || "A focused summary of the value you bring, the problems you solve, and the work you want to do next."}</p>
                  <Heading color={accentColor} className="mt-8">Experience</Heading>
                  <div className="mt-4 space-y-6">{(content.experience.length ? content.experience : [{ id: "placeholder", role: "Your latest role", company: "Company", period: "Dates", description: "Describe the outcome and impact of your work." }]).map((item) => <article key={item.id}><div className="flex items-baseline justify-between gap-3"><h3 className="text-[clamp(0.65rem,1.45vw,0.92rem)] font-extrabold">{item.role || "Role title"}</h3><span className="text-[clamp(0.45rem,1vw,0.65rem)] font-bold text-[#828985]">{item.period}</span></div><p className="mt-1 text-[clamp(0.48rem,1.05vw,0.68rem)] font-bold text-[#d65e48]">{item.company}</p><p className="mt-2 text-[clamp(0.52rem,1.1vw,0.72rem)] leading-[1.7] text-[#626b66]">{item.description}</p></article>)}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Panel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="rounded-[1.2rem] border border-black/[0.08] bg-white p-4 shadow-[0_8px_24px_rgba(18,63,53,0.035)] sm:p-5"><h2 className="text-sm font-extrabold">{title}</h2><p className="mb-5 mt-1 text-xs text-[#838b87]">{description}</p>{children}</section>;
}
function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) {
  return <label className="block"><span className="field-label">{label}</span><input className="field" type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}
function Heading({ children, color, className = "" }: { children: ReactNode; color: string; className?: string }) {
  return <h3 className={`text-[clamp(0.52rem,1.1vw,0.72rem)] font-black uppercase tracking-[0.16em] ${className}`} style={{ color }}>{children}</h3>;
}

