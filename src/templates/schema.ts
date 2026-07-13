import { z } from "zod";

export const resumeTemplateIdSchema = z.enum([
  "ATLAS",
  "MONO",
  "EDITORIAL",
  "EXECUTIVE",
  "STUDIO",
  "ACADEMIC",
]);

export const templateCategorySchema = z.enum([
  "ATS",
  "CORPORATE",
  "CREATIVE",
  "ACADEMIC",
]);

export const fontPairingSchema = z.enum([
  "INTER",
  "CLASSIC_SERIF",
  "EDITORIAL_SERIF",
]);

export const resumeSpacingSchema = z.enum([
  "COMPACT",
  "BALANCED",
  "SPACIOUS",
]);

export const resumeThemeSchema = z.object({
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  fontPairing: fontPairingSchema,
  spacing: resumeSpacingSchema,
  showIcons: z.boolean(),
  showProfilePhoto: z.boolean(),
});

export const resumeTemplateDefinitionSchema = z.object({
  id: resumeTemplateIdSchema,
  name: z.string().min(1),
  category: templateCategorySchema,
  description: z.string().min(1),
  isPremium: z.boolean(),
  renderer: z.enum(["ATS", "EXECUTIVE", "STUDIO", "ACADEMIC"]),
  supportsProfilePhoto: z.boolean(),
  recommendedFor: z.string().min(1),
});

export type ResumeTemplate = z.infer<typeof resumeTemplateIdSchema>;
export type ResumeTheme = z.infer<typeof resumeThemeSchema>;
export type ResumeTemplateDefinition = z.infer<
  typeof resumeTemplateDefinitionSchema
>;

export const DEFAULT_RESUME_THEME: ResumeTheme = {
  accentColor: "#0F766E",
  fontPairing: "INTER",
  spacing: "BALANCED",
  showIcons: true,
  showProfilePhoto: true,
};

export const RESUME_PALETTES = [
  { name: "Navy", value: "#173B63" },
  { name: "Emerald", value: "#0F766E" },
  { name: "Burgundy", value: "#7C2638" },
  { name: "Charcoal", value: "#303A3D" },
  { name: "Cobalt", value: "#2856A3" },
  { name: "Terracotta", value: "#A44F3E" },
] as const;

export const FONT_PAIRINGS = [
  {
    id: "INTER",
    name: "Modern Sans",
    description: "Clean and highly legible",
  },
  {
    id: "CLASSIC_SERIF",
    name: "Classic Serif",
    description: "Traditional and authoritative",
  },
  {
    id: "EDITORIAL_SERIF",
    name: "Editorial",
    description: "Expressive serif headings",
  },
] as const satisfies readonly {
  id: ResumeTheme["fontPairing"];
  name: string;
  description: string;
}[];

export function parseResumeTheme(
  value: string | null | undefined,
  legacyAccentColor?: string,
) {
  try {
    const parsed = resumeThemeSchema.safeParse(value ? JSON.parse(value) : {});
    if (parsed.success) return parsed.data;
  } catch {
    // Fall through to the backwards-compatible default.
  }
  return {
    ...DEFAULT_RESUME_THEME,
    ...(legacyAccentColor ? { accentColor: legacyAccentColor } : {}),
  };
}
