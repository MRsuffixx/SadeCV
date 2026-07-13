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
  header: { borderBottomWidth: 2, paddingBottom: 14, marginBottom: 18 },
  name: { fontSize: 28, lineHeight: 1, letterSpacing: -0.9 },
  title: {
    marginTop: 6,
    fontSize: 8,
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  contacts: { marginTop: 10 },
});

const order = [
  "summary",
  "employment",
  "education",
  "skills",
  "projects",
  "certifications",
  "languages",
  "awards",
  "volunteer",
  "publications",
  "references",
  "hobbies",
  "details",
] as const;

export function AtsPdfTemplate({
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
      author={presentation.identity.name}
      subject={definition.name}
    >
      <Page
        size="A4"
        wrap
        style={{
          padding: theme.pagePadding,
          backgroundColor: "#ffffff",
          color: "#202724",
          fontFamily: definition.id === "MONO" ? "Courier" : theme.body,
        }}
      >
        <View
          style={[
            styles.header,
            { borderColor: presentation.theme.accentColor },
          ]}
        >
          <Text
            style={[
              styles.name,
              {
                fontFamily:
                  definition.id === "MONO" ? "Courier-Bold" : theme.heading,
              },
            ]}
          >
            {presentation.identity.name}
          </Text>
          <Text
            style={[
              styles.title,
              {
                color: presentation.theme.accentColor,
                fontFamily: theme.heading,
              },
            ]}
          >
            {presentation.identity.professionalTitle}
          </Text>
          <View style={styles.contacts}>
            <PdfContactList
              items={[...presentation.contact, ...presentation.links]}
              presentation={presentation}
            />
          </View>
        </View>
        {sections.map((section) => (
          <PdfSection
            key={section.id}
            section={section}
            presentation={presentation}
          />
        ))}
        <PdfPageNumber />
      </Page>
    </Document>
  );
}
