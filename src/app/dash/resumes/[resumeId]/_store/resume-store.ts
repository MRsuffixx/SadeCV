import { create } from "zustand";

import {
  emptyResumeContent,
  parseResumeContent,
  type ResumeContent,
  type ResumeEducation,
  type ResumeExperience,
  type ResumeRecord,
  type ResumeTemplate,
} from "~/lib/resume-model";

type ResumeState = {
  resumeId: string | null;
  title: string;
  template: ResumeTemplate;
  accentColor: string;
  isPublic: boolean;
  content: ResumeContent;
  saved: boolean;
  hydrate: (resume: ResumeRecord) => void;
  setTitle: (value: string) => void;
  setTemplate: (value: ResumeTemplate) => void;
  setAccentColor: (value: string) => void;
  setPublic: (value: boolean) => void;
  setBasic: (field: keyof ResumeContent["basics"], value: string) => void;
  setSkills: (value: string[]) => void;
  addExperience: () => void;
  updateExperience: (
    id: string,
    field: keyof Omit<ResumeExperience, "id">,
    value: string,
  ) => void;
  removeExperience: (id: string) => void;
  addEducation: () => void;
  updateEducation: (
    id: string,
    field: keyof Omit<ResumeEducation, "id">,
    value: string,
  ) => void;
  removeEducation: (id: string) => void;
  markSaved: () => void;
};

export const useResumeStore = create<ResumeState>()((set) => ({
  resumeId: null,
  title: "Untitled CV",
  template: "ATLAS",
  accentColor: "#0F766E",
  isPublic: false,
  content: emptyResumeContent,
  saved: true,
  hydrate: (resume) =>
    set({
      resumeId: resume.id,
      title: resume.title,
      template: resume.template as ResumeTemplate,
      accentColor: resume.accentColor,
      isPublic: resume.isPublic,
      content: parseResumeContent(resume.contentJson),
      saved: true,
    }),
  setTitle: (title) => set({ title, saved: false }),
  setTemplate: (template) => set({ template, saved: false }),
  setAccentColor: (accentColor) => set({ accentColor, saved: false }),
  setPublic: (isPublic) => set({ isPublic, saved: false }),
  setBasic: (field, value) =>
    set((state) => ({
      content: {
        ...state.content,
        basics: { ...state.content.basics, [field]: value },
      },
      saved: false,
    })),
  setSkills: (skills) =>
    set((state) => ({
      content: { ...state.content, skills },
      saved: false,
    })),
  addExperience: () =>
    set((state) => ({
      content: {
        ...state.content,
        experience: [
          ...state.content.experience,
          {
            id: crypto.randomUUID(),
            role: "",
            company: "",
            period: "",
            description: "",
          },
        ],
      },
      saved: false,
    })),
  updateExperience: (id, field, value) =>
    set((state) => ({
      content: {
        ...state.content,
        experience: state.content.experience.map((item) =>
          item.id === id ? { ...item, [field]: value } : item,
        ),
      },
      saved: false,
    })),
  removeExperience: (id) =>
    set((state) => ({
      content: {
        ...state.content,
        experience: state.content.experience.filter((item) => item.id !== id),
      },
      saved: false,
    })),
  addEducation: () =>
    set((state) => ({
      content: {
        ...state.content,
        education: [
          ...state.content.education,
          { id: crypto.randomUUID(), school: "", degree: "", period: "" },
        ],
      },
      saved: false,
    })),
  updateEducation: (id, field, value) =>
    set((state) => ({
      content: {
        ...state.content,
        education: state.content.education.map((item) =>
          item.id === id ? { ...item, [field]: value } : item,
        ),
      },
      saved: false,
    })),
  removeEducation: (id) =>
    set((state) => ({
      content: {
        ...state.content,
        education: state.content.education.filter((item) => item.id !== id),
      },
      saved: false,
    })),
  markSaved: () => set({ saved: true }),
}));
