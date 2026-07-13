import { AcademicDomTemplate } from "~/templates/dom/academic-template";
import { AtsDomTemplate } from "~/templates/dom/ats-template";
import { ExecutiveDomTemplate } from "~/templates/dom/executive-template";
import { StudioDomTemplate } from "~/templates/dom/studio-template";
import type { DomTemplateProps } from "~/templates/dom/shared";

const DOM_RENDERERS = {
  ATS: AtsDomTemplate,
  EXECUTIVE: ExecutiveDomTemplate,
  STUDIO: StudioDomTemplate,
  ACADEMIC: AcademicDomTemplate,
} as const;

export function DomTemplateRenderer(props: DomTemplateProps) {
  const Renderer = DOM_RENDERERS[props.definition.renderer];
  return <Renderer {...props} />;
}
