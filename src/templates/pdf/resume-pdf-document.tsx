import type { ResumeContent } from "~/lib/resume-model";
import { AcademicPdfTemplate } from "~/templates/pdf/academic-template";
import { AtsPdfTemplate } from "~/templates/pdf/ats-template";
import { ExecutivePdfTemplate } from "~/templates/pdf/executive-template";
import { StudioPdfTemplate } from "~/templates/pdf/studio-template";
import { buildResumePresentation } from "~/templates/presentation";
import { getTemplateDefinition } from "~/templates/registry";
import type { ResumeTemplate, ResumeTheme } from "~/templates/schema";

export type ResumePdfData = {
  title: string;
  template: ResumeTemplate;
  theme: ResumeTheme;
  content: ResumeContent;
};

const PDF_RENDERERS = {
  ATS: AtsPdfTemplate,
  EXECUTIVE: ExecutivePdfTemplate,
  STUDIO: StudioPdfTemplate,
  ACADEMIC: AcademicPdfTemplate,
} as const;

export function ResumePdfDocument({ data }: { data: ResumePdfData }) {
  const definition = getTemplateDefinition(data.template);
  const presentation = buildResumePresentation(data.content, data.theme);
  const Renderer = PDF_RENDERERS[definition.renderer];
  return <Renderer presentation={presentation} definition={definition} />;
}
