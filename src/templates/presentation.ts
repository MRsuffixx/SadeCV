import { getResumeDisplayName, type ResumeContent } from "~/lib/resume-model";
import type { ResumeTheme } from "~/templates/schema";

export type PresentationContact = {
  id: string;
  label: string;
  value: string;
  href?: string;
};

export type PresentationItem = {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  body: string[];
  tags: string[];
  url?: string;
  progress?: number;
};

export type PresentationSection = {
  id: string;
  title: string;
  kind: "TEXT" | "TIMELINE" | "LIST" | "SKILLS";
  items: PresentationItem[];
};

export type ResumePresentation = {
  identity: {
    name: string;
    professionalTitle: string;
    avatarUrl: string;
  };
  contact: PresentationContact[];
  links: PresentationContact[];
  sections: Record<string, PresentationSection>;
  theme: ResumeTheme;
};

function compact(values: Array<string | undefined | null>) {
  return values.map((value) => value?.trim()).filter(Boolean) as string[];
}

function lines(...values: Array<string | undefined>) {
  return values
    .flatMap((value) => value?.split(/\r?\n/) ?? [])
    .map((value) => value.trim())
    .filter(Boolean);
}

export function formatResumeDate(value: string) {
  if (!value) return "";
  const [year, month] = value.split("-");
  const numericMonth = Number(month);
  return year && month && numericMonth >= 1 && numericMonth <= 12
    ? `${month}/${year}`
    : value;
}

export function formatResumePeriod(
  start: string,
  end: string,
  current: boolean,
) {
  return compact([
    formatResumeDate(start),
    current ? "Present" : formatResumeDate(end),
  ]).join(" — ");
}

export function humanizeResumeValue(value: string) {
  return value
    ? value
        .toLowerCase()
        .split("_")
        .map((word) => word[0]?.toUpperCase() + word.slice(1))
        .join(" ")
    : "";
}

function skillProgress(rating: number, proficiency: string) {
  if (rating > 0) return rating * 20;
  return (
    {
      BEGINNER: 30,
      INTERMEDIATE: 50,
      ADVANCED: 75,
      EXPERT: 95,
    }[proficiency] ?? 0
  );
}

function section(
  id: string,
  title: string,
  kind: PresentationSection["kind"],
  items: PresentationItem[],
) {
  return { id, title, kind, items } satisfies PresentationSection;
}

export function buildResumePresentation(
  content: ResumeContent,
  theme: ResumeTheme,
  options: { placeholders?: boolean } = {},
): ResumePresentation {
  const personal = content.personalInformation;
  const placeholders = options.placeholders ?? false;
  const name = getResumeDisplayName(content) || (placeholders ? "Your name" : "");
  const professionalTitle =
    personal.professionalTitle ||
    (placeholders ? "Your professional title" : "");
  const contact: PresentationContact[] = [
    { id: "email", label: "Email", value: personal.email, href: personal.email ? `mailto:${personal.email}` : undefined },
    { id: "phone", label: "Phone", value: personal.primaryPhone, href: personal.primaryPhone ? `tel:${personal.primaryPhone}` : undefined },
    { id: "phone-secondary", label: "Phone", value: personal.secondaryPhone, href: personal.secondaryPhone ? `tel:${personal.secondaryPhone}` : undefined },
    { id: "location", label: "Location", value: compact([personal.cityDistrict, personal.country]).join(", ") },
    { id: "address", label: "Address", value: compact([personal.fullAddress, personal.zipCode]).join(", ") },
  ].filter((item) => Boolean(item.value));
  const links: PresentationContact[] = [
    { id: "linkedin", label: "LinkedIn", value: personal.socials.linkedin, href: personal.socials.linkedin },
    { id: "github", label: "GitHub", value: personal.socials.github, href: personal.socials.github },
    { id: "portfolio", label: "Portfolio", value: personal.socials.portfolio, href: personal.socials.portfolio },
    { id: "design", label: "Design", value: personal.socials.designPortfolio, href: personal.socials.designPortfolio },
    { id: "communication", label: "Contact", value: personal.socials.communication },
  ].filter((item) => Boolean(item.value));

  const sections: Record<string, PresentationSection> = {};
  const add = (value: PresentationSection) => {
    if (value.items.length) sections[value.id] = value;
  };

  add(
    section("summary", "Professional profile", "TEXT", [
      ...(content.professionalSummary || placeholders
        ? [
            {
              id: "summary",
              title: "",
              body: [
                content.professionalSummary ||
                  "A focused summary of your experience, impact, and professional direction.",
              ],
              tags: [],
            },
          ]
        : []),
    ]),
  );

  const employment = content.employmentHistory.length
    ? content.employmentHistory
    : placeholders
      ? [
          {
            id: "employment-placeholder",
            jobTitle: "Your latest role",
            company: "Organization",
            startDate: "",
            endDate: "",
            current: false,
            employmentType: "",
            location: "",
            workModel: "",
            responsibilities: "Describe the scope and impact of your work.",
            achievements: "",
          },
        ]
      : [];
  add(
    section(
      "employment",
      "Employment",
      "TIMELINE",
      employment.map((item) => ({
        id: item.id,
        title: item.jobTitle,
        subtitle: item.company,
        meta: compact([
          formatResumePeriod(item.startDate, item.endDate, item.current),
          item.location,
          humanizeResumeValue(item.workModel),
        ]).join(" · "),
        body: lines(item.responsibilities, item.achievements),
        tags: compact([humanizeResumeValue(item.employmentType)]),
      })),
    ),
  );

  add(
    section(
      "education",
      "Education",
      "TIMELINE",
      content.education.map((item) => ({
        id: item.id,
        title: item.program,
        subtitle: item.institution,
        meta: compact([
          formatResumePeriod(item.startDate, item.graduationDate, item.ongoing),
          item.location,
          item.gpa ? `GPA ${item.gpa}` : "",
        ]).join(" · "),
        body: lines(item.description),
        tags: compact([item.degreeLevel]),
      })),
    ),
  );

  add(
    section(
      "skills",
      "Skills",
      "SKILLS",
      content.skills.map((item) => ({
        id: item.id,
        title: item.name,
        subtitle: item.category,
        meta: humanizeResumeValue(item.proficiency),
        progress: skillProgress(item.rating, item.proficiency),
        body: [],
        tags: [],
      })),
    ),
  );

  add(
    section(
      "languages",
      "Languages",
      "SKILLS",
      content.languages.map((item) => ({
        id: item.id,
        title: item.name,
        meta: item.useAdvancedLevels
          ? compact([
              `Reading ${item.readingLevel}`,
              `Writing ${item.writingLevel}`,
              `Speaking ${item.speakingLevel}`,
            ]).join(" · ")
          : humanizeResumeValue(item.generalLevel),
        body: [],
        tags: [],
      })),
    ),
  );

  add(
    section(
      "certifications",
      "Certifications & courses",
      "LIST",
      content.certifications.map((item) => ({
        id: item.id,
        title: item.name,
        subtitle: item.issuingOrganization,
        meta: compact([
          formatResumeDate(item.issueDate),
          item.doesNotExpire
            ? "No expiration"
            : formatResumeDate(item.expirationDate),
          item.credentialId ? `ID ${item.credentialId}` : "",
        ]).join(" · "),
        body: [],
        tags: [],
        url: item.credentialUrl,
      })),
    ),
  );

  add(
    section(
      "projects",
      "Selected projects",
      "TIMELINE",
      content.projects.map((item) => ({
        id: item.id,
        title: item.name,
        subtitle: item.associatedOrganization,
        meta: formatResumePeriod(item.startDate, item.endDate, false),
        body: lines(item.description),
        tags: item.techStack,
        url: item.projectUrl,
      })),
    ),
  );

  add(
    section(
      "awards",
      "Awards & honors",
      "LIST",
      content.awards.map((item) => ({
        id: item.id,
        title: item.name,
        subtitle: item.issuingOrganization,
        meta: formatResumeDate(item.dateReceived),
        body: lines(item.description),
        tags: [],
      })),
    ),
  );

  add(
    section(
      "volunteer",
      "Volunteer experience",
      "TIMELINE",
      content.volunteerExperience.map((item) => ({
        id: item.id,
        title: item.role,
        subtitle: item.organization,
        meta: compact([
          formatResumePeriod(item.startDate, item.endDate, item.current),
          item.location,
        ]).join(" · "),
        body: lines(item.responsibilities, item.achievements),
        tags: [],
      })),
    ),
  );

  add(
    section(
      "publications",
      "Publications",
      "LIST",
      content.publications.map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: item.publisher,
        meta: formatResumeDate(item.publicationDate),
        body: lines(item.description),
        tags: [],
        url: item.url,
      })),
    ),
  );

  add(
    section(
      "references",
      "References",
      "LIST",
      content.references.availableUponRequest
        ? [
            {
              id: "upon-request",
              title: "References available upon request.",
              body: [],
              tags: [],
            },
          ]
        : content.references.items.map((item) => ({
            id: item.id,
            title: item.fullName,
            subtitle: compact([item.professionalTitle, item.company]).join(
              " · ",
            ),
            meta: compact([item.email, item.phone]).join(" · "),
            body: [],
            tags: [],
          })),
    ),
  );

  add(
    section(
      "hobbies",
      "Hobbies & interests",
      "LIST",
      content.hobbies.map((item) => ({
        id: item.id,
        title: item.name,
        body: lines(item.description),
        tags: [],
      })),
    ),
  );

  const personalDetails = compact([
    personal.nationality ? `Nationality: ${personal.nationality}` : "",
    personal.dateOfBirth
      ? `Date of birth: ${formatResumeDate(personal.dateOfBirth)}`
      : "",
    personal.placeOfBirth ? `Place of birth: ${personal.placeOfBirth}` : "",
    personal.driversLicenseClass
      ? `Driver’s license: ${personal.driversLicenseClass}`
      : "",
    personal.militaryServiceStatus
      ? `Military service: ${humanizeResumeValue(personal.militaryServiceStatus)}`
      : "",
  ]);
  add(
    section(
      "details",
      "Personal details",
      "TEXT",
      personalDetails.length
        ? [
            {
              id: "personal-details",
              title: "",
              body: personalDetails,
              tags: [],
            },
          ]
        : [],
    ),
  );

  content.customSections.forEach((item) =>
    add(
      section(`custom-${item.id}`, item.title || "Additional information", "TEXT", [
        {
          id: item.id,
          title: "",
          body: lines(item.content),
          tags: [],
        },
      ]),
    ),
  );

  return {
    identity: {
      name,
      professionalTitle,
      avatarUrl: personal.avatarUrl,
    },
    contact,
    links,
    sections,
    theme,
  };
}

export function selectPresentationSections(
  presentation: ResumePresentation,
  ids: readonly string[],
) {
  return ids
    .map((id) => presentation.sections[id])
    .filter(Boolean) as PresentationSection[];
}

export function selectCustomSections(presentation: ResumePresentation) {
  return Object.values(presentation.sections).filter((item) =>
    item.id.startsWith("custom-"),
  );
}
