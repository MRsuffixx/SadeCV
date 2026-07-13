"use client";

import Image from "next/image";
import type { ReactNode } from "react";

import { useResumeStore } from "~/app/dash/resumes/[resumeId]/_store/resume-store";
import { getResumeDisplayName } from "~/lib/resume-model";

export function ResumePreview() {
  const content = useResumeStore((state) => state.content);
  const template = useResumeStore((state) => state.template);
  const accentColor = useResumeStore((state) => state.accentColor);
  const personal = content.personalInformation;
  const displayName = getResumeDisplayName(content) || "Your name";
  const mono = template === "MONO";

  return (
    <section className="min-w-0 bg-[#dde2dc] p-4 sm:p-7 lg:sticky lg:top-[72px] lg:flex lg:h-[calc(100vh-72px)] lg:items-start lg:justify-center lg:overflow-y-auto">
      <div className="mx-auto aspect-[210/297] w-full max-w-[820px] overflow-hidden bg-white shadow-[0_30px_90px_rgba(28,48,40,0.18)]">
        <article
          className={`min-h-full p-[6.5%] text-[#202824] ${
            mono ? "font-mono" : "font-sans"
          }`}
        >
          <header
            className={`pb-[4%] ${
              template === "EDITORIAL"
                ? "border-l-[0.35rem] pl-[4%]"
                : "border-b-2"
            }`}
            style={{ borderColor: accentColor }}
          >
            <div className="flex items-start justify-between gap-5">
              <div className="min-w-0">
                <h1
                  className="font-serif text-[clamp(1.35rem,4vw,2.8rem)] leading-[0.95] tracking-[-0.045em]"
                  style={{ color: accentColor }}
                >
                  {displayName}
                </h1>
                <p className="mt-[2.5%] text-[clamp(0.5rem,1.15vw,0.78rem)] font-black tracking-[0.16em] text-[#d65e48] uppercase">
                  {personal.professionalTitle || "Your professional title"}
                </p>
              </div>
              {personal.avatarUrl ? (
                <Image
                  src={personal.avatarUrl}
                  alt={`${displayName} portrait`}
                  width={92}
                  height={92}
                  unoptimized
                  className="size-[clamp(3rem,9vw,5.75rem)] shrink-0 rounded-[18%] object-cover"
                />
              ) : null}
            </div>
          </header>

          <div className="grid grid-cols-[28%_1fr] gap-[6%] pt-[5%]">
            <aside className="min-w-0">
              <PreviewSection title="Contact" color={accentColor}>
                <PreviewLines
                  values={[
                    personal.email,
                    personal.primaryPhone,
                    personal.secondaryPhone,
                    personal.cityDistrict,
                    personal.country,
                    personal.fullAddress,
                    personal.zipCode,
                  ]}
                />
              </PreviewSection>

              <PreviewSection title="Links" color={accentColor}>
                <PreviewLines
                  values={[
                    personal.socials.linkedin,
                    personal.socials.github,
                    personal.socials.portfolio,
                    personal.socials.designPortfolio,
                    personal.socials.communication,
                  ]}
                  fallback="Add your professional links"
                />
              </PreviewSection>

              <PreviewSection title="Skills" color={accentColor}>
                <div className="flex flex-wrap gap-[0.3rem]">
                  {(content.skills.length
                    ? content.skills
                    : [{ id: "placeholder", name: "Your skills", rating: 0 }]
                  ).map((skill) => (
                    <span
                      key={skill.id}
                      className="rounded-full bg-[#eef2ef] px-[0.45rem] py-[0.25rem] text-[clamp(0.38rem,0.82vw,0.58rem)] font-bold text-[#52605a]"
                    >
                      {skill.name || "Skill"}
                      {skill.rating ? ` · ${skill.rating}/5` : ""}
                    </span>
                  ))}
                </div>
              </PreviewSection>

              {content.languages.length ? (
                <PreviewSection title="Languages" color={accentColor}>
                  <div className="space-y-[0.45rem]">
                    {content.languages.map((language) => (
                      <div key={language.id}>
                        <p className="preview-small font-extrabold">
                          {language.name || "Language"}
                        </p>
                        <p className="preview-muted">
                          {language.useAdvancedLevels
                            ? [
                                `R ${language.readingLevel || "—"}`,
                                `W ${language.writingLevel || "—"}`,
                                `S ${language.speakingLevel || "—"}`,
                              ].join(" · ")
                            : language.generalLevel || "Level not specified"}
                        </p>
                      </div>
                    ))}
                  </div>
                </PreviewSection>
              ) : null}

              {content.education.length ? (
                <PreviewSection title="Education" color={accentColor}>
                  <div className="space-y-[0.7rem]">
                    {content.education.map((item) => (
                      <div key={item.id}>
                        <p className="preview-small font-extrabold">
                          {item.program || "Degree / program"}
                        </p>
                        <p className="preview-muted">{item.institution}</p>
                        <p className="preview-muted">
                          {formatPeriod(
                            item.startDate,
                            item.graduationDate,
                            item.ongoing,
                          )}
                        </p>
                        {item.gpa ? (
                          <p className="preview-muted">GPA {item.gpa}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </PreviewSection>
              ) : null}

              {content.certifications.length ? (
                <PreviewSection title="Credentials" color={accentColor}>
                  <div className="space-y-[0.65rem]">
                    {content.certifications.map((item) => (
                      <div key={item.id}>
                        <p className="preview-small font-extrabold">
                          {item.name || "Certification"}
                        </p>
                        <p className="preview-muted">
                          {item.issuingOrganization}
                        </p>
                        <p className="preview-muted">
                          {formatDate(item.issueDate)}
                        </p>
                      </div>
                    ))}
                  </div>
                </PreviewSection>
              ) : null}

              {hasPersonalDetails(personal) ? (
                <PreviewSection title="Details" color={accentColor}>
                  <PreviewLines
                    values={[
                      personal.nationality,
                      personal.dateOfBirth
                        ? `Born ${formatDate(personal.dateOfBirth)}`
                        : "",
                      personal.placeOfBirth,
                      personal.driversLicenseClass
                        ? `License ${personal.driversLicenseClass}`
                        : "",
                    ]}
                  />
                </PreviewSection>
              ) : null}
            </aside>

            <main className="min-w-0">
              <PreviewSection title="Profile" color={accentColor}>
                <p className="preview-body whitespace-pre-line">
                  {content.professionalSummary ||
                    "A focused summary of the value you bring, the problems you solve, and the work you want to do next."}
                </p>
              </PreviewSection>

              <PreviewSection title="Employment" color={accentColor}>
                <div className="space-y-[1rem]">
                  {(content.employmentHistory.length
                    ? content.employmentHistory
                    : [
                        {
                          id: "placeholder",
                          jobTitle: "Your latest role",
                          company: "Company",
                          startDate: "",
                          endDate: "",
                          current: false,
                          location: "",
                          responsibilities:
                            "Describe the outcome and impact of your work.",
                          achievements: "",
                        },
                      ]
                  ).map((item) => (
                    <TimelineItem
                      key={item.id}
                      title={item.jobTitle || "Role title"}
                      organization={item.company}
                      meta={[
                        formatPeriod(
                          item.startDate,
                          item.endDate,
                          item.current,
                        ),
                        item.location,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    >
                      <PreviewParagraphs
                        values={[item.responsibilities, item.achievements]}
                      />
                    </TimelineItem>
                  ))}
                </div>
              </PreviewSection>

              {content.projects.length ? (
                <PreviewSection title="Projects" color={accentColor}>
                  <div className="space-y-[0.9rem]">
                    {content.projects.map((item) => (
                      <TimelineItem
                        key={item.id}
                        title={item.name || "Project"}
                        organization={item.associatedOrganization}
                        meta={formatPeriod(item.startDate, item.endDate, false)}
                      >
                        <p className="preview-body whitespace-pre-line">
                          {item.description}
                        </p>
                        {item.techStack.length ? (
                          <p className="preview-muted mt-[0.3rem] font-bold">
                            {item.techStack.join(" · ")}
                          </p>
                        ) : null}
                      </TimelineItem>
                    ))}
                  </div>
                </PreviewSection>
              ) : null}

              {content.volunteerExperience.length ? (
                <PreviewSection
                  title="Volunteer experience"
                  color={accentColor}
                >
                  <div className="space-y-[0.9rem]">
                    {content.volunteerExperience.map((item) => (
                      <TimelineItem
                        key={item.id}
                        title={item.role || "Volunteer role"}
                        organization={item.organization}
                        meta={formatPeriod(
                          item.startDate,
                          item.endDate,
                          item.current,
                        )}
                      >
                        <PreviewParagraphs
                          values={[item.responsibilities, item.achievements]}
                        />
                      </TimelineItem>
                    ))}
                  </div>
                </PreviewSection>
              ) : null}

              {content.awards.length ? (
                <CompactItemsSection
                  title="Awards & honors"
                  color={accentColor}
                  items={content.awards.map((item) => ({
                    id: item.id,
                    title: item.name,
                    meta: [
                      item.issuingOrganization,
                      formatDate(item.dateReceived),
                    ]
                      .filter(Boolean)
                      .join(" · "),
                    description: item.description,
                  }))}
                />
              ) : null}

              {content.publications.length ? (
                <CompactItemsSection
                  title="Publications"
                  color={accentColor}
                  items={content.publications.map((item) => ({
                    id: item.id,
                    title: item.title,
                    meta: [item.publisher, formatDate(item.publicationDate)]
                      .filter(Boolean)
                      .join(" · "),
                    description: item.description,
                  }))}
                />
              ) : null}

              {content.references.availableUponRequest ? (
                <PreviewSection title="References" color={accentColor}>
                  <p className="preview-body font-semibold">
                    References available upon request.
                  </p>
                </PreviewSection>
              ) : content.references.items.length ? (
                <CompactItemsSection
                  title="References"
                  color={accentColor}
                  items={content.references.items.map((item) => ({
                    id: item.id,
                    title: item.fullName,
                    meta: [item.professionalTitle, item.company]
                      .filter(Boolean)
                      .join(" · "),
                    description: [item.email, item.phone]
                      .filter(Boolean)
                      .join(" · "),
                  }))}
                />
              ) : null}

              {content.hobbies.length ? (
                <CompactItemsSection
                  title="Hobbies & interests"
                  color={accentColor}
                  items={content.hobbies.map((item) => ({
                    id: item.id,
                    title: item.name,
                    description: item.description,
                  }))}
                />
              ) : null}

              {content.customSections.map((item) => (
                <PreviewSection
                  key={item.id}
                  title={item.title || "Custom section"}
                  color={accentColor}
                >
                  <p className="preview-body whitespace-pre-line">
                    {item.content}
                  </p>
                </PreviewSection>
              ))}
            </main>
          </div>
        </article>
      </div>
    </section>
  );
}

function PreviewSection({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-[8%] break-inside-avoid">
      <h2
        className="mb-[0.55rem] text-[clamp(0.43rem,0.96vw,0.68rem)] font-black tracking-[0.16em] uppercase"
        style={{ color }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function TimelineItem({
  title,
  organization,
  meta,
  children,
}: {
  title: string;
  organization: string;
  meta: string;
  children: ReactNode;
}) {
  return (
    <article className="break-inside-avoid">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[clamp(0.58rem,1.2vw,0.83rem)] leading-tight font-extrabold">
            {title}
          </h3>
          {organization ? (
            <p className="mt-[0.18rem] text-[clamp(0.46rem,0.96vw,0.66rem)] font-extrabold text-[#d65e48]">
              {organization}
            </p>
          ) : null}
        </div>
        {meta ? (
          <p className="max-w-[42%] shrink-0 text-right text-[clamp(0.38rem,0.8vw,0.56rem)] leading-snug font-bold text-[#7c8580]">
            {meta}
          </p>
        ) : null}
      </div>
      <div className="mt-[0.42rem]">{children}</div>
    </article>
  );
}

function CompactItemsSection({
  title,
  color,
  items,
}: {
  title: string;
  color: string;
  items: { id: string; title: string; meta?: string; description?: string }[];
}) {
  return (
    <PreviewSection title={title} color={color}>
      <div className="space-y-[0.72rem]">
        {items.map((item) => (
          <article key={item.id} className="break-inside-avoid">
            <p className="preview-small font-extrabold">
              {item.title || title.replace(/s$/, "")}
            </p>
            {item.meta ? <p className="preview-muted">{item.meta}</p> : null}
            {item.description ? (
              <p className="preview-body mt-[0.25rem] whitespace-pre-line">
                {item.description}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </PreviewSection>
  );
}

function PreviewLines({
  values,
  fallback = "Add your contact details",
}: {
  values: string[];
  fallback?: string;
}) {
  const visible = values.filter(Boolean);
  return (
    <div className="space-y-[0.28rem]">
      {(visible.length ? visible : [fallback]).map((value, index) => (
        <p key={`${value}-${index}`} className="preview-muted break-words">
          {value}
        </p>
      ))}
    </div>
  );
}

function PreviewParagraphs({ values }: { values: string[] }) {
  return (
    <div className="space-y-[0.3rem]">
      {values.filter(Boolean).map((value, index) => (
        <p
          key={`${value.slice(0, 24)}-${index}`}
          className="preview-body whitespace-pre-line"
        >
          {value}
        </p>
      ))}
    </div>
  );
}

function formatDate(value: string) {
  if (!value) return "";
  const [year, month] = value.split("-");
  return [month, year].filter(Boolean).join("/");
}

function formatPeriod(start: string, end: string, current: boolean) {
  const startLabel = formatDate(start);
  const endLabel = current ? "Present" : formatDate(end);
  return [startLabel, endLabel].filter(Boolean).join(" — ");
}

function hasPersonalDetails(
  personal: ReturnType<
    typeof useResumeStore.getState
  >["content"]["personalInformation"],
) {
  return Boolean(
    personal.nationality ||
    personal.dateOfBirth ||
    personal.placeOfBirth ||
    personal.driversLicenseClass,
  );
}
