import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import {
  getPdfTheme,
  PdfContactList,
  PdfPageNumber,
  PdfSection,
} from "~/templates/pdf/shared";
import {
  selectCustomSections,
  selectPresentationSections,
  type ResumePresentation,
} from "~/templates/presentation";
import type { ResumeTemplateDefinition } from "~/templates/schema";

const styles = StyleSheet.create({
  header: { alignItems: "center", marginBottom: 24 },
  overline: { fontSize: 6.2, letterSpacing: 1.8, textTransform: "uppercase" },
  name: { marginTop: 8, fontSize: 27, letterSpacing: -0.8 },
  title: { marginTop: 5, fontSize: 8, color: "#68716d", fontStyle: "italic" },
  contacts: { marginTop: 10, maxWidth: "88%", justifyContent: "center" },
  rule: { marginTop: 13, width: "72%", height: 1 },
});

const order = [
  "summary",
  "education",
  "publications",
  "employment",
  "projects",
  "awards",
  "certifications",
  "volunteer",
  "skills",
  "languages",
  "references",
  "hobbies",
  "details",
] as const;

export function AcademicPdfTemplate({
  presentation,
  definition,
}: {
  presentation: ResumePresentation;
  definition: ResumeTemplateDefinition;
}) {
  const theme = getPdfTheme(presentation);
  const sections = [
    ...selectPresentationSections(presentation, order),
    ...selectCustomSections(presentation),
  ];
  return (
    <Document
      title={presentation.identity.name}
      subject="Academic curriculum vitae"
    >
      <Page
        size="A4"
        wrap
        style={{
          padding: theme.pagePadding + 2,
          backgroundColor: "#fffefa",
          color: "#292c2a",
          fontFamily: theme.body,
        }}
      >
        <View style={styles.header}>
          <Text
            style={[
              styles.overline,
              {
                color: presentation.theme.accentColor,
                fontFamily: theme.heading,
              },
            ]}
          >
            {definition.id === "EDITORIAL"
              ? "Curriculum vitae"
              : "Academic curriculum vitae"}
          </Text>
          <Text style={[styles.name, { fontFamily: theme.heading }]}>
            {presentation.identity.name}
          </Text>
          <Text style={[styles.title, { fontFamily: theme.body }]}>
            {presentation.identity.professionalTitle}
          </Text>
          <View style={styles.contacts}>
            <PdfContactList
              items={[...presentation.contact, ...presentation.links]}
              presentation={presentation}
            />
          </View>
          <View
            style={[
              styles.rule,
              { backgroundColor: presentation.theme.accentColor },
            ]}
          />
        </View>
        {sections.map((section) => (
          <PdfSection
            key={section.id}
            section={section}
            presentation={presentation}
            numbered={section.id === "publications"}
          />
        ))}
        <PdfPageNumber />
      </Page>
    </Document>
  );
}
