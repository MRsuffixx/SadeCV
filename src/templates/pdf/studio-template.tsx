import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

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

const styles = StyleSheet.create({
  page: {
    flexDirection: "row",
    paddingVertical: 34,
    backgroundColor: "#ffffff",
    color: "#202824",
  },
  sidebarBackground: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "34%",
  },
  sidebar: {
    width: "34%",
    paddingHorizontal: 24,
    color: "#ffffff",
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 23,
    objectFit: "cover",
    borderWidth: 4,
    borderColor: "#ffffff35",
  },
  initials: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: "#ffffff20",
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: { color: "#ffffff", fontSize: 28 },
  name: {
    marginTop: 24,
    fontSize: 23,
    lineHeight: 0.96,
    letterSpacing: -0.7,
    color: "#ffffff",
  },
  title: {
    marginTop: 8,
    fontSize: 7,
    lineHeight: 1.4,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: "#ffffffa8",
  },
  connectLabel: {
    marginTop: 25,
    marginBottom: 7,
    fontSize: 6,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#ffffff8f",
  },
  sidebarSections: { marginTop: 24 },
  main: { width: "66%", paddingHorizontal: 32 },
  mainRule: { width: 65, height: 4, borderRadius: 4, marginBottom: 8 },
  mainLabel: {
    marginBottom: 24,
    fontSize: 6,
    letterSpacing: 1.4,
    color: "#89928d",
    textTransform: "uppercase",
  },
});

export function StudioPdfTemplate({
  presentation,
}: {
  presentation: ResumePresentation;
}) {
  const theme = getPdfTheme(presentation);
  const sidebar = selectPresentationSections(presentation, [
    "skills",
    "languages",
    "education",
    "certifications",
    "hobbies",
    "details",
  ]);
  const main = [
    ...selectPresentationSections(presentation, [
      "summary",
      "employment",
      "projects",
      "awards",
      "volunteer",
      "publications",
      "references",
    ]),
    ...selectCustomSections(presentation),
  ];
  const showPhoto =
    presentation.theme.showProfilePhoto && presentation.identity.avatarUrl;
  return (
    <Document
      title={presentation.identity.name}
      subject="Creative professional resume"
    >
      <Page size="A4" wrap style={[styles.page, { fontFamily: theme.body }]}>
        <View
          fixed
          style={[
            styles.sidebarBackground,
            { backgroundColor: presentation.theme.accentColor },
          ]}
        />
        <View style={styles.sidebar}>
          {/* React PDF images are decorative here and do not expose DOM alt text. */}
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          {showPhoto ? (
            <Image
              src={presentation.identity.avatarUrl}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.initials}>
              <Text
                style={[styles.initialsText, { fontFamily: theme.heading }]}
              >
                {presentation.identity.name.slice(0, 1)}
              </Text>
            </View>
          )}
          <Text style={[styles.name, { fontFamily: theme.heading }]}>
            {presentation.identity.name}
          </Text>
          <Text style={[styles.title, { fontFamily: theme.heading }]}>
            {presentation.identity.professionalTitle}
          </Text>
          <Text style={[styles.connectLabel, { fontFamily: theme.heading }]}>
            Connect
          </Text>
          <PdfContactList
            items={[...presentation.contact, ...presentation.links]}
            presentation={presentation}
            inverse
          />
          <View style={styles.sidebarSections}>
            {sidebar.map((section) => (
              <PdfSection
                key={section.id}
                section={section}
                presentation={presentation}
                inverse
              />
            ))}
          </View>
        </View>
        <View style={styles.main}>
          <View
            style={[
              styles.mainRule,
              { backgroundColor: presentation.theme.accentColor },
            ]}
          />
          <Text style={[styles.mainLabel, { fontFamily: theme.heading }]}>
            Selected work & experience
          </Text>
          {main.map((section) => (
            <PdfSection
              key={section.id}
              section={section}
              presentation={presentation}
            />
          ))}
        </View>
        <PdfPageNumber />
      </Page>
    </Document>
  );
}
