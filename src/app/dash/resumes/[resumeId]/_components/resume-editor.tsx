"use client";

import {
  ArrowLeft,
  Camera,
  Check,
  Crown,
  Download,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { useResumeStore } from "~/app/dash/resumes/[resumeId]/_store/resume-store";
import type { ResumeRecord, ResumeTemplate } from "~/lib/resume-model";
import { api } from "~/trpc/react";
import { useUploadThing } from "~/utils/uploadthing";

export function ResumeEditor({ resume }: { resume: ResumeRecord }) {
  const activeResumeId = useResumeStore((state) => state.resumeId);
  const hydrate = useResumeStore((state) => state.hydrate);

  useEffect(() => hydrate(resume), [hydrate, resume]);

  if (activeResumeId !== resume.id) {
    return (
      <main className="grid min-h-[calc(100vh-72px)] place-items-center bg-[#e8ebe6]">
        <LoaderCircle className="animate-spin text-[#277b67]" size={28} />
      </main>
    );
  }

  return <HydratedResumeEditor resumeId={resume.id} />;
}

function HydratedResumeEditor({ resumeId }: { resumeId: string }) {
  const title = useResumeStore((state) => state.title);
  const saved = useResumeStore((state) => state.saved);
  const isPublic = useResumeStore((state) => state.isPublic);
  const setTitle = useResumeStore((state) => state.setTitle);
  const setPublic = useResumeStore((state) => state.setPublic);
  const markSaved = useResumeStore((state) => state.markSaved);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const { data: entitlement } = api.billing.entitlements.useQuery();
  const mutation = api.resume.update.useMutation({ onSuccess: markSaved });

  const save = () => {
    const state = useResumeStore.getState();
    mutation.mutate({
      id: resumeId,
      title: state.title,
      template: state.template,
      accentColor: state.accentColor,
      isPublic: state.isPublic,
      contentJson: JSON.stringify(state.content),
      status:
        state.content.basics.name && state.content.basics.headline
          ? "READY"
          : "DRAFT",
    });
  };

  const exportPdf = async () => {
    setExporting(true);
    setExportError("");
    try {
      const [{ pdf }, { ResumePdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("~/app/dash/resumes/[resumeId]/_components/resume-pdf-document"),
      ]);
      const state = useResumeStore.getState();
      const blob = await pdf(
        <ResumePdfDocument
          data={{
            title: state.title,
            template: state.template,
            accentColor: state.accentColor,
            content: state.content,
          }}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      const safeTitle = state.title
        .trim()
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-|-$/g, "");
      anchor.download = `${safeTitle.length ? safeTitle : "sadecv"}.pdf`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch {
      setExportError("PDF generation failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#e8ebe6]">
      <div className="border-b border-black/[0.08] bg-[#fbfbf8] px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/dash"
              aria-label="Back to dashboard"
              className="grid size-9 shrink-0 place-items-center rounded-xl border border-black/10 bg-white text-[#66706b]"
            >
              <ArrowLeft size={17} />
            </Link>
            <div className="min-w-0">
              <input
                aria-label="CV title"
                value={title}
                maxLength={120}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full truncate bg-transparent text-sm font-extrabold outline-none"
              />
              <p className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-[#8b928e]">
                {saved ? (
                  <>
                    <Check size={11} className="text-[#2b806a]" />
                    All changes saved
                  </>
                ) : (
                  "Unsaved changes"
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="hidden items-center gap-2 rounded-full bg-[#edf1ee] px-3 py-2 text-xs font-bold text-[#65706b] sm:flex">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(event) => setPublic(event.target.checked)}
                className="accent-[#277b67]"
              />
              Shareable
            </label>
            <button
              type="button"
              onClick={exportPdf}
              disabled={exporting}
              className="button-secondary min-h-9 px-3 text-xs disabled:opacity-50"
            >
              {exporting ? (
                <LoaderCircle className="animate-spin" size={15} />
              ) : (
                <Download size={15} />
              )}
              <span className="hidden sm:inline">
                {exporting ? "Rendering…" : "Download PDF"}
              </span>
            </button>
            <button
              type="button"
              onClick={save}
              disabled={mutation.isPending || saved}
              className="button-primary min-h-9 px-4 text-xs disabled:opacity-50"
            >
              <Save size={15} />
              {mutation.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
        {mutation.error ? (
          <p
            role="alert"
            className="mx-auto mt-2 max-w-[1500px] text-xs font-bold text-[#b64632]"
          >
            We couldn’t save these changes. Please try again.
          </p>
        ) : exportError ? (
          <p
            role="alert"
            className="mx-auto mt-2 max-w-[1500px] text-xs font-bold text-[#b64632]"
          >
            {exportError}
          </p>
        ) : null}
      </div>

      <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[430px_1fr]">
        <section className="max-h-[calc(100vh-133px)] overflow-y-auto border-r border-black/[0.08] bg-[#f8f8f5] p-4 sm:p-6">
          <p className="eyebrow text-[#277b67]">Live editor</p>
          <h1 className="mt-2 mb-5 font-serif text-2xl text-[#123f35]">
            Shape your story.
          </h1>
          <div className="space-y-4">
            <ProfilePanel resumeId={resumeId} />
            <ExperiencePanel />
            <EducationPanel />
            <SkillsPanel />
            <StylePanel isPremium={entitlement?.isPremium ?? false} />
          </div>
        </section>
        <ResumePreview />
      </div>
    </main>
  );
}

function ProfilePanel({ resumeId }: { resumeId: string }) {
  const basics = useResumeStore((state) => state.content.basics);
  const setBasic = useResumeStore((state) => state.setBasic);
  const inputRef = useRef<HTMLInputElement>(null);
  const { startUpload, isUploading } = useUploadThing("resumeAsset", {
    onClientUploadComplete: (files) => {
      const url = files[0]?.serverData.url;
      if (url) setBasic("imageUrl", url);
    },
  });

  return (
    <Panel title="Profile" description="The essentials at a glance.">
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-2xl bg-[#f2f5f2] p-3">
          <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#dfeae5] text-[#22604f]">
            {basics.imageUrl ? (
              <Image
                src={basics.imageUrl}
                alt="CV profile"
                width={56}
                height={56}
                unoptimized
                className="size-full object-cover"
              />
            ) : (
              <Camera size={19} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold">Portrait</p>
            <p className="mt-0.5 text-[10px] text-[#818985]">
              Cloud-hosted image URL
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (file) await startUpload([file], { resumeId });
              event.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-black/10 bg-white px-2.5 py-2 text-[10px] font-extrabold disabled:opacity-50"
          >
            {isUploading ? "Uploading…" : "Upload"}
          </button>
        </div>
        <Field
          label="Full name"
          value={basics.name}
          onChange={(value) => setBasic("name", value)}
          placeholder="Alex Morgan"
        />
        <Field
          label="Professional headline"
          value={basics.headline}
          onChange={(value) => setBasic("headline", value)}
          placeholder="Product designer & systems thinker"
        />
        <Field
          label="Email"
          type="email"
          value={basics.email}
          onChange={(value) => setBasic("email", value)}
          placeholder="alex@example.com"
        />
        <label className="block">
          <span className="field-label">Professional summary</span>
          <textarea
            className="field min-h-28 resize-y"
            value={basics.summary}
            onChange={(event) => setBasic("summary", event.target.value)}
            placeholder="A concise view of your strengths, focus, and impact."
            maxLength={900}
          />
        </label>
      </div>
    </Panel>
  );
}

function ExperiencePanel() {
  const experience = useResumeStore((state) => state.content.experience);
  const add = useResumeStore((state) => state.addExperience);
  const update = useResumeStore((state) => state.updateExperience);
  const remove = useResumeStore((state) => state.removeExperience);
  return (
    <Panel title="Experience" description="Show impact, not just activity.">
      <div className="space-y-4">
        {experience.map((item, index) => (
          <EditableCard
            key={item.id}
            label={`Role ${index + 1}`}
            onRemove={() => remove(item.id)}
          >
            <Field
              label="Role"
              value={item.role}
              onChange={(value) => update(item.id, "role", value)}
              placeholder="Design Lead"
            />
            <Field
              label="Company"
              value={item.company}
              onChange={(value) => update(item.id, "company", value)}
              placeholder="Northstar Labs"
            />
            <Field
              label="Period"
              value={item.period}
              onChange={(value) => update(item.id, "period", value)}
              placeholder="2022—Present"
            />
            <label className="block">
              <span className="field-label">Impact</span>
              <textarea
                className="field min-h-24 resize-y"
                value={item.description}
                onChange={(event) =>
                  update(item.id, "description", event.target.value)
                }
                placeholder="What changed because of your work?"
                maxLength={1200}
              />
            </label>
          </EditableCard>
        ))}
        <AddButton onClick={add}>Add experience</AddButton>
      </div>
    </Panel>
  );
}

function EducationPanel() {
  const education = useResumeStore((state) => state.content.education);
  const add = useResumeStore((state) => state.addEducation);
  const update = useResumeStore((state) => state.updateEducation);
  const remove = useResumeStore((state) => state.removeEducation);
  return (
    <Panel
      title="Education"
      description="Add the credentials that support your direction."
    >
      <div className="space-y-4">
        {education.map((item, index) => (
          <EditableCard
            key={item.id}
            label={`Education ${index + 1}`}
            onRemove={() => remove(item.id)}
          >
            <Field
              label="School"
              value={item.school}
              onChange={(value) => update(item.id, "school", value)}
              placeholder="University or institution"
            />
            <Field
              label="Degree"
              value={item.degree}
              onChange={(value) => update(item.id, "degree", value)}
              placeholder="BSc, Product Design"
            />
            <Field
              label="Period"
              value={item.period}
              onChange={(value) => update(item.id, "period", value)}
              placeholder="2017—2021"
            />
          </EditableCard>
        ))}
        <AddButton onClick={add}>Add education</AddButton>
      </div>
    </Panel>
  );
}

function SkillsPanel() {
  const skills = useResumeStore((state) => state.content.skills);
  const setSkills = useResumeStore((state) => state.setSkills);
  return (
    <Panel title="Skills" description="A concise signal of your range.">
      <label className="block">
        <span className="field-label">Skills, separated by commas</span>
        <textarea
          className="field min-h-24 resize-y"
          value={skills.join(", ")}
          onChange={(event) =>
            setSkills(
              event.target.value
                .split(",")
                .map((skill) => skill.trim())
                .filter(Boolean),
            )
          }
          placeholder="Product strategy, Research, Figma"
        />
      </label>
    </Panel>
  );
}

const templates: { value: ResumeTemplate; premium: boolean }[] = [
  { value: "ATLAS", premium: false },
  { value: "MONO", premium: false },
  { value: "EDITORIAL", premium: false },
  { value: "EXECUTIVE", premium: true },
  { value: "STUDIO", premium: true },
];

function StylePanel({ isPremium }: { isPremium: boolean }) {
  const template = useResumeStore((state) => state.template);
  const accentColor = useResumeStore((state) => state.accentColor);
  const setTemplate = useResumeStore((state) => state.setTemplate);
  const setAccentColor = useResumeStore((state) => state.setAccentColor);
  return (
    <Panel title="Visual style" description="Keep it recognizably yours.">
      <span className="field-label">Template</span>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {templates.map(({ value, premium }) => {
          const locked = premium && !isPremium;
          return (
            <button
              key={value}
              type="button"
              onClick={() =>
                locked ? window.location.assign("/pricing") : setTemplate(value)
              }
              className={`relative rounded-xl border px-2 py-2.5 text-[10px] font-extrabold ${template === value ? "border-[#277b67] bg-[#e4f1eb] text-[#1d5e4d]" : "border-black/10 bg-white text-[#78807c]"}`}
            >
              {value}
              {premium ? (
                <Crown
                  className="absolute top-1.5 right-1.5 text-[#d18a35]"
                  size={11}
                />
              ) : null}
            </button>
          );
        })}
      </div>
      <span className="field-label mt-4">Accent color</span>
      <div className="flex gap-2">
        {["#0F766E", "#1E3A5F", "#7C3F58", "#4E5D3D", "#202020"].map(
          (color) => (
            <button
              key={color}
              type="button"
              onClick={() => setAccentColor(color)}
              aria-label={`Use accent color ${color}`}
              className={`size-8 rounded-full border-2 border-white shadow ${accentColor === color ? "ring-2 ring-[#ef765f] ring-offset-2" : ""}`}
              style={{ backgroundColor: color }}
            />
          ),
        )}
      </div>
    </Panel>
  );
}

function ResumePreview() {
  const basics = useResumeStore((state) => state.content.basics);
  const experience = useResumeStore((state) => state.content.experience);
  const education = useResumeStore((state) => state.content.education);
  const skills = useResumeStore((state) => state.content.skills);
  const template = useResumeStore((state) => state.template);
  const accentColor = useResumeStore((state) => state.accentColor);
  return (
    <section
      aria-label="Live CV preview"
      className="grid min-h-[calc(100vh-133px)] place-items-center overflow-auto p-5 sm:p-10"
    >
      <div
        className={`aspect-[0.707] w-full max-w-[720px] bg-white shadow-[0_35px_90px_rgba(18,63,53,0.17)] ${template === "MONO" ? "font-mono" : ""}`}
      >
        <div className="p-[8%]">
          <header
            className={
              template === "EDITORIAL" ? "border-l-4 pl-6" : "border-b-2 pb-6"
            }
            style={{ borderColor: accentColor }}
          >
            <h2
              className="font-serif text-[clamp(2rem,5vw,4rem)] leading-none tracking-[-0.045em]"
              style={{ color: accentColor }}
            >
              {basics.name || "Your name"}
            </h2>
            <p className="mt-3 text-[clamp(0.6rem,1.4vw,0.9rem)] font-extrabold tracking-[0.2em] text-[#d65e48] uppercase">
              {basics.headline || "Your professional headline"}
            </p>
          </header>
          <div className="grid grid-cols-[0.31fr_0.69fr] gap-[7%] pt-8">
            <aside>
              {basics.imageUrl ? (
                <Image
                  src={basics.imageUrl}
                  alt=""
                  width={160}
                  height={160}
                  unoptimized
                  className="mb-6 aspect-square w-3/4 rounded-2xl object-cover"
                />
              ) : null}
              <Heading color={accentColor}>Contact</Heading>
              <p className="mt-3 text-[clamp(0.55rem,1.2vw,0.78rem)] leading-6 break-all text-[#68716d]">
                {basics.email || "you@example.com"}
              </p>
              <Heading color={accentColor} className="mt-8">
                Skills
              </Heading>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(skills.length ? skills : ["Your", "Key", "Skills"]).map(
                  (skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-[#eef2ef] px-2 py-1 text-[clamp(0.45rem,1vw,0.67rem)] font-bold text-[#52605a]"
                    >
                      {skill}
                    </span>
                  ),
                )}
              </div>
              {education.length ? (
                <>
                  <Heading color={accentColor} className="mt-8">
                    Education
                  </Heading>
                  <div className="mt-3 space-y-4">
                    {education.map((item) => (
                      <article key={item.id}>
                        <p className="text-[clamp(0.52rem,1.1vw,0.72rem)] font-extrabold">
                          {item.degree || "Degree"}
                        </p>
                        <p className="mt-1 text-[clamp(0.45rem,1vw,0.64rem)] text-[#68716d]">
                          {item.school}
                        </p>
                        <p className="text-[clamp(0.43rem,0.95vw,0.62rem)] text-[#828985]">
                          {item.period}
                        </p>
                      </article>
                    ))}
                  </div>
                </>
              ) : null}
            </aside>
            <div>
              <Heading color={accentColor}>Profile</Heading>
              <p className="mt-3 text-[clamp(0.55rem,1.2vw,0.78rem)] leading-[1.8] text-[#59625e]">
                {basics.summary ||
                  "A focused summary of the value you bring, the problems you solve, and the work you want to do next."}
              </p>
              <Heading color={accentColor} className="mt-8">
                Experience
              </Heading>
              <div className="mt-4 space-y-6">
                {(experience.length
                  ? experience
                  : [
                      {
                        id: "placeholder",
                        role: "Your latest role",
                        company: "Company",
                        period: "Dates",
                        description:
                          "Describe the outcome and impact of your work.",
                      },
                    ]
                ).map((item) => (
                  <article key={item.id}>
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-[clamp(0.65rem,1.45vw,0.92rem)] font-extrabold">
                        {item.role || "Role title"}
                      </h3>
                      <span className="text-[clamp(0.45rem,1vw,0.65rem)] font-bold text-[#828985]">
                        {item.period}
                      </span>
                    </div>
                    <p className="mt-1 text-[clamp(0.48rem,1.05vw,0.68rem)] font-bold text-[#d65e48]">
                      {item.company}
                    </p>
                    <p className="mt-2 text-[clamp(0.52rem,1.1vw,0.72rem)] leading-[1.7] text-[#626b66]">
                      {item.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.2rem] border border-black/[0.08] bg-white p-4 shadow-[0_8px_24px_rgba(18,63,53,0.035)] sm:p-5">
      <h2 className="text-sm font-extrabold">{title}</h2>
      <p className="mt-1 mb-5 text-xs text-[#838b87]">{description}</p>
      {children}
    </section>
  );
}

function EditableCard({
  label,
  onRemove,
  children,
}: {
  label: string;
  onRemove: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/[0.08] bg-[#fafbf8] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-extrabold tracking-wider text-[#7a837e] uppercase">
          {label}
        </span>
        <button
          type="button"
          aria-label={`Remove ${label}`}
          onClick={onRemove}
          className="text-[#9b6860]"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function AddButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#277b67]/30 bg-[#edf5f1] px-4 py-3 text-xs font-extrabold text-[#246451]"
    >
      <Plus size={15} />
      {children}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <input
        className="field"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function Heading({
  children,
  color,
  className = "",
}: {
  children: ReactNode;
  color: string;
  className?: string;
}) {
  return (
    <h3
      className={`text-[clamp(0.52rem,1.1vw,0.72rem)] font-black tracking-[0.16em] uppercase ${className}`}
      style={{ color }}
    >
      {children}
    </h3>
  );
}
