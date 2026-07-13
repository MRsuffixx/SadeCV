import {
  resumeTemplateDefinitionSchema,
  type ResumeTemplate,
  type ResumeTemplateDefinition,
} from "~/templates/schema";

const definitions = [
  {
    id: "ATLAS",
    name: "Atlas ATS",
    category: "ATS",
    description: "Single-column, machine-readable, and typography-led.",
    isPremium: false,
    renderer: "ATS",
    supportsProfilePhoto: false,
    recommendedFor: "High-volume applications and ATS portals",
  },
  {
    id: "MONO",
    name: "Mono ATS",
    category: "ATS",
    description: "A compact technical variation of the ATS layout.",
    isPremium: false,
    renderer: "ATS",
    supportsProfilePhoto: false,
    recommendedFor: "Engineering and technical roles",
  },
  {
    id: "EDITORIAL",
    name: "Editorial",
    category: "ACADEMIC",
    description: "Serif-led long-form layout for comprehensive careers.",
    isPremium: false,
    renderer: "ACADEMIC",
    supportsProfilePhoto: false,
    recommendedFor: "Research, writing, and culture",
  },
  {
    id: "EXECUTIVE",
    name: "Boardroom",
    category: "CORPORATE",
    description: "Elegant hierarchy and structured executive positioning.",
    isPremium: true,
    renderer: "EXECUTIVE",
    supportsProfilePhoto: true,
    recommendedFor: "C-level and senior leadership",
  },
  {
    id: "STUDIO",
    name: "Studio Grid",
    category: "CREATIVE",
    description: "Two-column geometry, avatar focus, and skill indicators.",
    isPremium: true,
    renderer: "STUDIO",
    supportsProfilePhoto: true,
    recommendedFor: "Design, product, and creative technology",
  },
  {
    id: "ACADEMIC",
    name: "Scholarly",
    category: "ACADEMIC",
    description: "Multi-page flow optimized for publications and research.",
    isPremium: true,
    renderer: "ACADEMIC",
    supportsProfilePhoto: false,
    recommendedFor: "Faculty, research, and grant applications",
  },
] as const;

export const TEMPLATE_REGISTRY = Object.fromEntries(
  definitions.map((definition) => [
    definition.id,
    resumeTemplateDefinitionSchema.parse(definition),
  ]),
) as Record<ResumeTemplate, ResumeTemplateDefinition>;

export const TEMPLATE_DEFINITIONS = definitions.map(
  ({ id }) => TEMPLATE_REGISTRY[id],
);

export function getTemplateDefinition(id: ResumeTemplate) {
  return TEMPLATE_REGISTRY[id];
}

export function isPremiumTemplate(id: ResumeTemplate) {
  return TEMPLATE_REGISTRY[id].isPremium;
}
