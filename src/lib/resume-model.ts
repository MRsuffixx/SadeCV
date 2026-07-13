export type ResumeTemplate =
  "ATLAS" | "MONO" | "EDITORIAL" | "EXECUTIVE" | "STUDIO";

export type ResumeExperience = {
  id: string;
  role: string;
  company: string;
  period: string;
  description: string;
};

export type ResumeEducation = {
  id: string;
  school: string;
  degree: string;
  period: string;
};

export type ResumeContent = {
  basics: {
    name: string;
    email: string;
    headline: string;
    summary: string;
    imageUrl: string;
  };
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: string[];
};

export type ResumeRecord = {
  id: string;
  title: string;
  template: string;
  accentColor: string;
  contentJson: string;
  status: string;
  isPublic: boolean;
};

export const emptyResumeContent: ResumeContent = {
  basics: {
    name: "",
    email: "",
    headline: "",
    summary: "",
    imageUrl: "",
  },
  experience: [],
  education: [],
  skills: [],
};

export function parseResumeContent(value: string): ResumeContent {
  try {
    const parsed = JSON.parse(value) as Partial<ResumeContent>;
    return {
      ...emptyResumeContent,
      ...parsed,
      basics: { ...emptyResumeContent.basics, ...parsed.basics },
      experience: parsed.experience ?? [],
      education: parsed.education ?? [],
      skills: parsed.skills ?? [],
    };
  } catch {
    return emptyResumeContent;
  }
}
