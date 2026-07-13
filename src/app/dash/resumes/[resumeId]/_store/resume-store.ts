import { create } from "zustand";

import {
  createEmptyResumeContent,
  createResumeArrayItem,
  parseResumeContent,
  type PersonalInformation,
  type ResumeArrayItemMap,
  type ResumeArraySection,
  type ResumeContent,
  type ResumeRecord,
  type ResumeTemplate,
} from "~/lib/resume-model";
import {
  DEFAULT_RESUME_THEME,
  parseResumeTheme,
  type ResumeTheme,
} from "~/templates/schema";

type PersonalField = Exclude<keyof PersonalInformation, "socials">;
type SocialField = keyof PersonalInformation["socials"];

type ResumeState = {
  resumeId: string | null;
  title: string;
  selectedTemplateId: ResumeTemplate;
  theme: ResumeTheme;
  isPublic: boolean;
  content: ResumeContent;
  saved: boolean;
  hydrate: (resume: ResumeRecord) => void;
  setTitle: (value: string) => void;
  setTemplate: (value: ResumeTemplate) => void;
  setTheme: <K extends keyof ResumeTheme>(
    field: K,
    value: ResumeTheme[K],
  ) => void;
  setPublic: (value: boolean) => void;
  setPersonal: <K extends PersonalField>(
    field: K,
    value: PersonalInformation[K],
  ) => void;
  setSocial: (
    field: SocialField,
    value: PersonalInformation["socials"][SocialField],
  ) => void;
  setProfessionalSummary: (value: string) => void;
  setReferencesAvailableUponRequest: (value: boolean) => void;
  addItem: <S extends ResumeArraySection>(section: S) => void;
  updateItem: <S extends ResumeArraySection>(
    section: S,
    id: string,
    patch: Partial<Omit<ResumeArrayItemMap[S], "id">>,
  ) => void;
  removeItem: <S extends ResumeArraySection>(section: S, id: string) => void;
  moveItem: <S extends ResumeArraySection>(
    section: S,
    id: string,
    direction: -1 | 1,
  ) => void;
  markSaved: () => void;
};

type AnyResumeItem = ResumeArrayItemMap[ResumeArraySection];

function getItems(content: ResumeContent, section: ResumeArraySection) {
  if (section === "references") return content.references.items;
  return content[section] as AnyResumeItem[];
}

function replaceItems(
  content: ResumeContent,
  section: ResumeArraySection,
  items: AnyResumeItem[],
): ResumeContent {
  if (section === "references") {
    return {
      ...content,
      references: {
        ...content.references,
        items: items as ResumeContent["references"]["items"],
      },
    };
  }
  return { ...content, [section]: items };
}

export const useResumeStore = create<ResumeState>()((set) => ({
  resumeId: null,
  title: "Untitled CV",
  selectedTemplateId: "ATLAS",
  theme: DEFAULT_RESUME_THEME,
  isPublic: false,
  content: createEmptyResumeContent(),
  saved: true,
  hydrate: (resume) =>
    set({
      resumeId: resume.id,
      title: resume.title,
      selectedTemplateId: resume.template as ResumeTemplate,
      theme: parseResumeTheme(resume.themeJson, resume.accentColor),
      isPublic: resume.isPublic,
      content: parseResumeContent(resume.contentJson),
      saved: true,
    }),
  setTitle: (title) => set({ title, saved: false }),
  setTemplate: (selectedTemplateId) =>
    set({ selectedTemplateId, saved: false }),
  setTheme: (field, value) =>
    set((state) => ({
      theme: { ...state.theme, [field]: value },
      saved: false,
    })),
  setPublic: (isPublic) => set({ isPublic, saved: false }),
  setPersonal: (field, value) =>
    set((state) => ({
      content: {
        ...state.content,
        personalInformation: {
          ...state.content.personalInformation,
          [field]: value,
        },
      },
      saved: false,
    })),
  setSocial: (field, value) =>
    set((state) => ({
      content: {
        ...state.content,
        personalInformation: {
          ...state.content.personalInformation,
          socials: {
            ...state.content.personalInformation.socials,
            [field]: value,
          },
        },
      },
      saved: false,
    })),
  setProfessionalSummary: (professionalSummary) =>
    set((state) => ({
      content: { ...state.content, professionalSummary },
      saved: false,
    })),
  setReferencesAvailableUponRequest: (availableUponRequest) =>
    set((state) => ({
      content: {
        ...state.content,
        references: { ...state.content.references, availableUponRequest },
      },
      saved: false,
    })),
  addItem: (section) =>
    set((state) => ({
      content: replaceItems(state.content, section, [
        ...getItems(state.content, section),
        createResumeArrayItem(section),
      ]),
      saved: false,
    })),
  updateItem: (section, id, patch) =>
    set((state) => ({
      content: replaceItems(
        state.content,
        section,
        getItems(state.content, section).map((item) =>
          item.id === id ? { ...item, ...patch } : item,
        ),
      ),
      saved: false,
    })),
  removeItem: (section, id) =>
    set((state) => ({
      content: replaceItems(
        state.content,
        section,
        getItems(state.content, section).filter((item) => item.id !== id),
      ),
      saved: false,
    })),
  moveItem: (section, id, direction) =>
    set((state) => {
      const items = [...getItems(state.content, section)];
      const from = items.findIndex((item) => item.id === id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= items.length) return state;
      const [item] = items.splice(from, 1);
      if (!item) return state;
      items.splice(to, 0, item);
      return {
        content: replaceItems(state.content, section, items),
        saved: false,
      };
    }),
  markSaved: () => set({ saved: true }),
}));
