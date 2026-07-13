import { z } from "zod";

import {
  isAllowedResumeImageUrl,
  normalizeHttpUrl,
} from "~/lib/remote-assets";

export {
  resumeTemplateIdSchema as resumeTemplateSchema,
  type ResumeTemplate,
} from "~/templates/schema";

export const RESUME_SCHEMA_VERSION = 3 as const;

const itemIdSchema = z.string().min(1).max(100);
const shortText = (max = 180) => z.string().trim().max(max).default("");
const longText = (max = 6_000) => z.string().trim().max(max).default("");
const emailValue = z
  .union([z.literal(""), z.string().trim().email().max(254)])
  .default("");
const urlValue = z
  .string()
  .trim()
  .max(2_048)
  .transform((value, ctx) => {
    const normalized = normalizeHttpUrl(value);
    if (normalized === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid web address, such as example.com.",
      });
      return z.NEVER;
    }
    return normalized;
  })
  .default("");
const trustedImageUrlValue = urlValue.refine(isAllowedResumeImageUrl, {
  message: "Profile images must be uploaded through SadeCV.",
});
const dateValue = z
  .string()
  .refine((value) => {
    if (!value) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(Date.UTC(year ?? 0, (month ?? 0) - 1, day));
    return (
      parsed.getUTCFullYear() === year &&
      parsed.getUTCMonth() === (month ?? 0) - 1 &&
      parsed.getUTCDate() === day
    );
  }, "Enter a valid calendar date.")
  .default("");

export const employmentTypeSchema = z.enum([
  "",
  "FULL_TIME",
  "PART_TIME",
  "FREELANCE",
  "CONTRACT",
  "INTERNSHIP",
  "TEMPORARY",
  "VOLUNTEER",
  "OTHER",
]);

export const workModelSchema = z.enum(["", "REMOTE", "HYBRID", "ON_SITE"]);

export const proficiencySchema = z.enum([
  "",
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "EXPERT",
]);

export const languageLevelSchema = z.enum([
  "",
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
  "BEGINNER",
  "ELEMENTARY",
  "INTERMEDIATE",
  "ADVANCED",
  "PROFESSIONAL",
  "NATIVE",
]);

const socialsSchema = z.object({
  linkedin: urlValue,
  github: urlValue,
  portfolio: urlValue,
  designPortfolio: urlValue,
  communication: shortText(240),
});

export const personalInformationDraftSchema = z.object({
  avatarUrl: trustedImageUrlValue,
  firstName: shortText(100),
  lastName: shortText(100),
  email: emailValue,
  primaryPhone: shortText(40),
  cityDistrict: shortText(140),
  country: shortText(100),
  professionalTitle: shortText(180),
  secondaryPhone: shortText(40),
  fullAddress: shortText(400),
  zipCode: shortText(24),
  dateOfBirth: dateValue,
  placeOfBirth: shortText(140),
  nationality: shortText(100),
  gender: z
    .enum(["", "FEMALE", "MALE", "NON_BINARY", "OTHER", "UNDISCLOSED"])
    .default(""),
  maritalStatus: z
    .enum(["", "SINGLE", "MARRIED", "DIVORCED", "WIDOWED", "UNDISCLOSED"])
    .default(""),
  driversLicenseClass: shortText(40),
  militaryServiceStatus: z
    .enum(["", "COMPLETED", "EXEMPT", "DEFERRED", "NOT_APPLICABLE"])
    .default(""),
  militaryDefermentDate: dateValue,
  socials: socialsSchema,
});

export const employmentDraftSchema = z.object({
  id: itemIdSchema,
  company: shortText(180),
  jobTitle: shortText(180),
  startDate: dateValue,
  endDate: dateValue,
  current: z.boolean().default(false),
  employmentType: employmentTypeSchema.default(""),
  location: shortText(180),
  workModel: workModelSchema.default(""),
  responsibilities: longText(8_000),
  achievements: longText(8_000),
});

export const educationDraftSchema = z.object({
  id: itemIdSchema,
  institution: shortText(200),
  program: shortText(200),
  startDate: dateValue,
  graduationDate: dateValue,
  ongoing: z.boolean().default(false),
  degreeLevel: shortText(100),
  location: shortText(180),
  gpa: shortText(40),
  description: longText(5_000),
});

export const skillDraftSchema = z.object({
  id: itemIdSchema,
  name: shortText(140),
  proficiency: proficiencySchema.default(""),
  rating: z.number().int().min(0).max(5).default(0),
  category: shortText(100),
});

export const languageDraftSchema = z.object({
  id: itemIdSchema,
  name: shortText(100),
  generalLevel: languageLevelSchema.default(""),
  useAdvancedLevels: z.boolean().default(false),
  readingLevel: languageLevelSchema.default(""),
  writingLevel: languageLevelSchema.default(""),
  speakingLevel: languageLevelSchema.default(""),
});

export const certificationDraftSchema = z.object({
  id: itemIdSchema,
  name: shortText(220),
  issuingOrganization: shortText(200),
  issueDate: dateValue,
  expirationDate: dateValue,
  doesNotExpire: z.boolean().default(false),
  credentialId: shortText(180),
  credentialUrl: urlValue,
});

export const projectDraftSchema = z.object({
  id: itemIdSchema,
  name: shortText(220),
  associatedOrganization: shortText(200),
  startDate: dateValue,
  endDate: dateValue,
  projectUrl: urlValue,
  techStack: z.array(shortText(80)).max(40).default([]),
  description: longText(8_000),
});

export const awardDraftSchema = z.object({
  id: itemIdSchema,
  name: shortText(220),
  issuingOrganization: shortText(200),
  dateReceived: dateValue,
  description: longText(4_000),
});

export const volunteerDraftSchema = z.object({
  id: itemIdSchema,
  organization: shortText(200),
  role: shortText(180),
  startDate: dateValue,
  endDate: dateValue,
  current: z.boolean().default(false),
  employmentType: employmentTypeSchema.default("VOLUNTEER"),
  location: shortText(180),
  workModel: workModelSchema.default(""),
  responsibilities: longText(8_000),
  achievements: longText(8_000),
});

export const publicationDraftSchema = z.object({
  id: itemIdSchema,
  title: shortText(240),
  publisher: shortText(220),
  publicationDate: dateValue,
  url: urlValue,
  description: longText(5_000),
});

export const referenceDraftSchema = z.object({
  id: itemIdSchema,
  fullName: shortText(180),
  professionalTitle: shortText(180),
  company: shortText(200),
  phone: shortText(40),
  email: emailValue,
});

export const hobbyDraftSchema = z.object({
  id: itemIdSchema,
  name: shortText(140),
  description: longText(2_000),
});

export const customSectionDraftSchema = z.object({
  id: itemIdSchema,
  title: shortText(180),
  content: longText(10_000),
});

const referencesDraftSchema = z.object({
  availableUponRequest: z.boolean().default(false),
  items: z.array(referenceDraftSchema).max(30).default([]),
});

export const resumeDraftContentSchema = z
  .object({
    schemaVersion: z
      .literal(RESUME_SCHEMA_VERSION)
      .default(RESUME_SCHEMA_VERSION),
    personalInformation: personalInformationDraftSchema,
    professionalSummary: longText(8_000),
    employmentHistory: z.array(employmentDraftSchema).max(50).default([]),
    education: z.array(educationDraftSchema).max(40).default([]),
    skills: z.array(skillDraftSchema).max(120).default([]),
    languages: z.array(languageDraftSchema).max(40).default([]),
    certifications: z.array(certificationDraftSchema).max(60).default([]),
    projects: z.array(projectDraftSchema).max(60).default([]),
    awards: z.array(awardDraftSchema).max(50).default([]),
    volunteerExperience: z.array(volunteerDraftSchema).max(50).default([]),
    publications: z.array(publicationDraftSchema).max(60).default([]),
    references: referencesDraftSchema,
    hobbies: z.array(hobbyDraftSchema).max(60).default([]),
    customSections: z.array(customSectionDraftSchema).max(40).default([]),
  })
  .strict()
  .superRefine((content, ctx) => {
    if (JSON.stringify(content).length > 500_000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CV content exceeds the 500 KB limit",
        path: [],
      });
    }

    const repeatableSections = [
      ["employmentHistory", content.employmentHistory],
      ["education", content.education],
      ["skills", content.skills],
      ["languages", content.languages],
      ["certifications", content.certifications],
      ["projects", content.projects],
      ["awards", content.awards],
      ["volunteerExperience", content.volunteerExperience],
      ["publications", content.publications],
      ["references", content.references.items],
      ["hobbies", content.hobbies],
      ["customSections", content.customSections],
    ] as const;

    repeatableSections.forEach(([section, items]) => {
      const seen = new Set<string>();
      items.forEach((item, index) => {
        if (seen.has(item.id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Item IDs must be unique within a section",
            path: [section, index, "id"],
          });
        }
        seen.add(item.id);
      });
    });
  });

type ValidationContext = z.RefinementCtx;

function requireText(
  value: string,
  path: (string | number)[],
  ctx: ValidationContext,
) {
  if (!value.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Required",
      path,
    });
  }
}

function validateDateRange(
  startDate: string,
  endDate: string,
  path: (string | number)[],
  ctx: ValidationContext,
) {
  if (startDate && endDate && endDate < startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "End date must be after the start date",
      path,
    });
  }
}

export const resumeContentSchema = resumeDraftContentSchema.superRefine(
  (content, ctx) => {
    const personal = content.personalInformation;
    (
      [
        ["firstName", personal.firstName],
        ["lastName", personal.lastName],
        ["email", personal.email],
        ["primaryPhone", personal.primaryPhone],
        ["cityDistrict", personal.cityDistrict],
        ["country", personal.country],
      ] as const
    ).forEach(([field, value]) =>
      requireText(value, ["personalInformation", field], ctx),
    );

    content.employmentHistory.forEach((item, index) => {
      requireText(item.company, ["employmentHistory", index, "company"], ctx);
      requireText(item.jobTitle, ["employmentHistory", index, "jobTitle"], ctx);
      requireText(
        item.startDate,
        ["employmentHistory", index, "startDate"],
        ctx,
      );
      if (!item.current) {
        validateDateRange(
          item.startDate,
          item.endDate,
          ["employmentHistory", index, "endDate"],
          ctx,
        );
      }
    });

    content.education.forEach((item, index) => {
      requireText(item.institution, ["education", index, "institution"], ctx);
      requireText(item.program, ["education", index, "program"], ctx);
      requireText(item.startDate, ["education", index, "startDate"], ctx);
      if (!item.ongoing) {
        validateDateRange(
          item.startDate,
          item.graduationDate,
          ["education", index, "graduationDate"],
          ctx,
        );
      }
    });

    content.skills.forEach((item, index) =>
      requireText(item.name, ["skills", index, "name"], ctx),
    );
    content.languages.forEach((item, index) =>
      requireText(item.name, ["languages", index, "name"], ctx),
    );
    content.certifications.forEach((item, index) => {
      requireText(item.name, ["certifications", index, "name"], ctx);
      requireText(
        item.issuingOrganization,
        ["certifications", index, "issuingOrganization"],
        ctx,
      );
    });
    content.projects.forEach((item, index) =>
      requireText(item.name, ["projects", index, "name"], ctx),
    );
    content.awards.forEach((item, index) => {
      requireText(item.name, ["awards", index, "name"], ctx);
      requireText(
        item.issuingOrganization,
        ["awards", index, "issuingOrganization"],
        ctx,
      );
    });
    content.volunteerExperience.forEach((item, index) => {
      requireText(
        item.organization,
        ["volunteerExperience", index, "organization"],
        ctx,
      );
      requireText(item.role, ["volunteerExperience", index, "role"], ctx);
      requireText(
        item.startDate,
        ["volunteerExperience", index, "startDate"],
        ctx,
      );
      if (!item.current) {
        validateDateRange(
          item.startDate,
          item.endDate,
          ["volunteerExperience", index, "endDate"],
          ctx,
        );
      }
    });
    content.publications.forEach((item, index) => {
      requireText(item.title, ["publications", index, "title"], ctx);
      requireText(item.publisher, ["publications", index, "publisher"], ctx);
    });
    if (!content.references.availableUponRequest) {
      content.references.items.forEach((item, index) => {
        requireText(
          item.fullName,
          ["references", "items", index, "fullName"],
          ctx,
        );
        requireText(
          item.professionalTitle,
          ["references", "items", index, "professionalTitle"],
          ctx,
        );
      });
    }
    content.hobbies.forEach((item, index) =>
      requireText(item.name, ["hobbies", index, "name"], ctx),
    );
    content.customSections.forEach((item, index) => {
      requireText(item.title, ["customSections", index, "title"], ctx);
      requireText(item.content, ["customSections", index, "content"], ctx);
    });
  },
);

export type ResumeContent = z.infer<typeof resumeDraftContentSchema>;
export type PersonalInformation = ResumeContent["personalInformation"];
export type ResumeEmployment = ResumeContent["employmentHistory"][number];
export type ResumeEducation = ResumeContent["education"][number];
export type ResumeSkill = ResumeContent["skills"][number];
export type ResumeLanguage = ResumeContent["languages"][number];
export type ResumeCertification = ResumeContent["certifications"][number];
export type ResumeProject = ResumeContent["projects"][number];
export type ResumeAward = ResumeContent["awards"][number];
export type ResumeVolunteer = ResumeContent["volunteerExperience"][number];
export type ResumePublication = ResumeContent["publications"][number];
export type ResumeReference = ResumeContent["references"]["items"][number];
export type ResumeHobby = ResumeContent["hobbies"][number];
export type ResumeCustomSection = ResumeContent["customSections"][number];

export type ResumeArrayItemMap = {
  employmentHistory: ResumeEmployment;
  education: ResumeEducation;
  skills: ResumeSkill;
  languages: ResumeLanguage;
  certifications: ResumeCertification;
  projects: ResumeProject;
  awards: ResumeAward;
  volunteerExperience: ResumeVolunteer;
  publications: ResumePublication;
  references: ResumeReference;
  hobbies: ResumeHobby;
  customSections: ResumeCustomSection;
};

export type ResumeArraySection = keyof ResumeArrayItemMap;

export type ResumeRecord = {
  id: string;
  title: string;
  template: string;
  accentColor: string;
  themeJson?: string;
  contentJson: string;
  contentSchemaVersion?: number;
  status: string;
  isPublic: boolean;
};

const emptySocials = () => ({
  linkedin: "",
  github: "",
  portfolio: "",
  designPortfolio: "",
  communication: "",
});

export function createEmptyResumeContent(
  prefill: Partial<
    Pick<PersonalInformation, "firstName" | "lastName" | "email">
  > = {},
): ResumeContent {
  return {
    schemaVersion: RESUME_SCHEMA_VERSION,
    personalInformation: {
      avatarUrl: "",
      firstName: prefill.firstName ?? "",
      lastName: prefill.lastName ?? "",
      email: prefill.email ?? "",
      primaryPhone: "",
      cityDistrict: "",
      country: "",
      professionalTitle: "",
      secondaryPhone: "",
      fullAddress: "",
      zipCode: "",
      dateOfBirth: "",
      placeOfBirth: "",
      nationality: "",
      gender: "",
      maritalStatus: "",
      driversLicenseClass: "",
      militaryServiceStatus: "",
      militaryDefermentDate: "",
      socials: emptySocials(),
    },
    professionalSummary: "",
    employmentHistory: [],
    education: [],
    skills: [],
    languages: [],
    certifications: [],
    projects: [],
    awards: [],
    volunteerExperience: [],
    publications: [],
    references: { availableUponRequest: false, items: [] },
    hobbies: [],
    customSections: [],
  };
}

export const emptyResumeContent = createEmptyResumeContent();

let fallbackItemSequence = 0;

function createItemId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  fallbackItemSequence += 1;
  return `resume-item-${fallbackItemSequence}`;
}

export function createResumeArrayItem<S extends ResumeArraySection>(
  section: S,
): ResumeArrayItemMap[S] {
  const id = createItemId();
  const factories: { [K in ResumeArraySection]: () => ResumeArrayItemMap[K] } =
    {
      employmentHistory: () => ({
        id,
        company: "",
        jobTitle: "",
        startDate: "",
        endDate: "",
        current: false,
        employmentType: "",
        location: "",
        workModel: "",
        responsibilities: "",
        achievements: "",
      }),
      education: () => ({
        id,
        institution: "",
        program: "",
        startDate: "",
        graduationDate: "",
        ongoing: false,
        degreeLevel: "",
        location: "",
        gpa: "",
        description: "",
      }),
      skills: () => ({
        id,
        name: "",
        proficiency: "",
        rating: 0,
        category: "",
      }),
      languages: () => ({
        id,
        name: "",
        generalLevel: "",
        useAdvancedLevels: false,
        readingLevel: "",
        writingLevel: "",
        speakingLevel: "",
      }),
      certifications: () => ({
        id,
        name: "",
        issuingOrganization: "",
        issueDate: "",
        expirationDate: "",
        doesNotExpire: false,
        credentialId: "",
        credentialUrl: "",
      }),
      projects: () => ({
        id,
        name: "",
        associatedOrganization: "",
        startDate: "",
        endDate: "",
        projectUrl: "",
        techStack: [],
        description: "",
      }),
      awards: () => ({
        id,
        name: "",
        issuingOrganization: "",
        dateReceived: "",
        description: "",
      }),
      volunteerExperience: () => ({
        id,
        organization: "",
        role: "",
        startDate: "",
        endDate: "",
        current: false,
        employmentType: "VOLUNTEER",
        location: "",
        workModel: "",
        responsibilities: "",
        achievements: "",
      }),
      publications: () => ({
        id,
        title: "",
        publisher: "",
        publicationDate: "",
        url: "",
        description: "",
      }),
      references: () => ({
        id,
        fullName: "",
        professionalTitle: "",
        company: "",
        phone: "",
        email: "",
      }),
      hobbies: () => ({ id, name: "", description: "" }),
      customSections: () => ({ id, title: "", content: "" }),
    };
  return factories[section]();
}

function splitName(value: unknown) {
  const name = typeof value === "string" ? value.trim() : "";
  const parts = name.split(/\s+/).filter(Boolean);
  return {
    firstName: parts.shift() ?? "",
    lastName: parts.join(" "),
  };
}

function migrateLegacyContent(raw: Record<string, unknown>): ResumeContent {
  const basics = (raw.basics ?? {}) as Record<string, unknown>;
  const name = splitName(basics.name);
  const result = createEmptyResumeContent({
    ...name,
    email: typeof basics.email === "string" ? basics.email : "",
  });
  result.personalInformation.professionalTitle =
    typeof basics.headline === "string" ? basics.headline : "";
  result.personalInformation.avatarUrl =
    typeof basics.imageUrl === "string" ? basics.imageUrl : "";
  result.professionalSummary =
    typeof basics.summary === "string" ? basics.summary : "";

  if (Array.isArray(raw.experience)) {
    result.employmentHistory = raw.experience.map((value, index) => {
      const item = value as Record<string, unknown>;
      const period = typeof item.period === "string" ? item.period : "";
      const description =
        typeof item.description === "string" ? item.description : "";
      return {
        ...createResumeArrayItem("employmentHistory"),
        id: typeof item.id === "string" ? item.id : `legacy-job-${index}`,
        company: typeof item.company === "string" ? item.company : "",
        jobTitle: typeof item.role === "string" ? item.role : "",
        responsibilities: [period, description].filter(Boolean).join("\n"),
      };
    });
  }

  if (Array.isArray(raw.education)) {
    result.education = raw.education.map((value, index) => {
      const item = value as Record<string, unknown>;
      return {
        ...createResumeArrayItem("education"),
        id: typeof item.id === "string" ? item.id : `legacy-education-${index}`,
        institution: typeof item.school === "string" ? item.school : "",
        program: typeof item.degree === "string" ? item.degree : "",
        description: typeof item.period === "string" ? item.period : "",
      };
    });
  }

  if (Array.isArray(raw.skills)) {
    result.skills = raw.skills.flatMap((value, index) =>
      typeof value === "string"
        ? [
            {
              ...createResumeArrayItem("skills"),
              id: `legacy-skill-${index}`,
              name: value,
            },
          ]
        : [],
    );
  }
  return result;
}

function mergeCurrentContent(raw: Record<string, unknown>): unknown {
  const fallback = createEmptyResumeContent();
  const personal = (raw.personalInformation ?? {}) as Record<string, unknown>;
  const socials = (personal.socials ?? {}) as Record<string, unknown>;
  const references = (raw.references ?? {}) as Record<string, unknown>;
  return {
    ...fallback,
    ...raw,
    schemaVersion: RESUME_SCHEMA_VERSION,
    personalInformation: {
      ...fallback.personalInformation,
      ...personal,
      socials: { ...fallback.personalInformation.socials, ...socials },
    },
    references: {
      ...fallback.references,
      ...references,
      items: Array.isArray(references.items) ? references.items : [],
    },
  };
}

export class ResumeContentParseError extends Error {
  constructor() {
    super("Stored resume content is invalid.");
    this.name = "ResumeContentParseError";
  }
}

export function parseResumeContent(value: string): ResumeContent {
  try {
    const raw = JSON.parse(value) as unknown;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      throw new ResumeContentParseError();
    }
    const record = raw as Record<string, unknown>;
    const candidate =
      "basics" in record
        ? migrateLegacyContent(record)
        : mergeCurrentContent(record);
    const parsed = resumeDraftContentSchema.safeParse(candidate);
    if (!parsed.success) throw new ResumeContentParseError();
    return parsed.data;
  } catch (error) {
    if (error instanceof ResumeContentParseError) throw error;
    throw new ResumeContentParseError();
  }
}

export function isResumeReady(content: ResumeContent) {
  return resumeContentSchema.safeParse(content).success;
}

export function getResumeDisplayName(content: ResumeContent) {
  return [
    content.personalInformation.firstName,
    content.personalInformation.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}
