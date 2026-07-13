import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { getPdfTheme, PdfContactList, PdfPageNumber, PdfSection } from "~/templates/pdf/shared";
import { selectCustomSections, selectPresentationSections, type ResumePresentation } from "~/templates/presentation";

const styles = StyleSheet.create({
  header: { paddingHorizontal: 38, paddingTop: 34, paddingBottom: 24, color: "#ffffff" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 24 },
  overline: { fontSize: 6, letterSpacing: 1.7, textTransform: "uppercase", color: "#ffffff88" },
  name: { marginTop: 7, maxWidth: 390, fontSize: 28, lineHeight: 0.96, letterSpacing: -0.8 },
  title: { marginTop: 7, fontSize: 8, letterSpacing: 1.2, textTransform: "uppercase", color: "#ffffffc4" },
  avatar: { width: 72, height: 72, borderRadius: 36, objectFit: "cover", borderWidth: 3, borderColor: "#ffffff40" },
  contacts: { marginTop: 17, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#ffffff2b" },
  columns: { flexDirection: "row", gap: 24, paddingHorizontal: 38, paddingVertical: 28 },
  sidebar: { width: "29%", paddingRight: 16, borderRightWidth: 1 },
  main: { flexGrow: 1 },
});

export function ExecutivePdfTemplate({ presentation }: { presentation: ResumePresentation }) {
  const theme = getPdfTheme(presentation);
  const sidebar = selectPresentationSections(presentation, ["skills", "education", "languages", "certifications", "details"]);
  const main = [...selectPresentationSections(presentation, ["summary", "employment", "projects", "awards", "volunteer", "publications", "references", "hobbies"]), ...selectCustomSections(presentation)];
  const showPhoto = presentation.theme.showProfilePhoto && presentation.identity.avatarUrl;
  return (
    <Document title={presentation.identity.name}>
      <Page size="A4" wrap style={{ backgroundColor: "#fbfbf8", color: "#202824", fontFamily: theme.body }}>
        <View style={[styles.header, { backgroundColor: presentation.theme.accentColor }]}>
          <View style={styles.headerRow}>
            <View><Text style={[styles.overline, { fontFamily: theme.heading }]}>Executive profile</Text><Text style={[styles.name, { fontFamily: theme.heading }]}>{presentation.identity.name}</Text><Text style={[styles.title, { fontFamily: theme.heading }]}>{presentation.identity.professionalTitle}</Text></View>
            {/* React PDF images are decorative here and do not expose DOM alt text. */}
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            {showPhoto ? <Image src={presentation.identity.avatarUrl} style={styles.avatar} /> : null}
          </View>
          <View style={styles.contacts}><PdfContactList items={[...presentation.contact, ...presentation.links]} presentation={presentation} inverse /></View>
        </View>
        <View style={styles.columns}>
          <View style={[styles.sidebar, { borderRightColor: `${presentation.theme.accentColor}40` }]}>{sidebar.map((section) => <PdfSection key={section.id} section={section} presentation={presentation} />)}</View>
          <View style={styles.main}>{main.map((section) => <PdfSection key={section.id} section={section} presentation={presentation} />)}</View>
        </View>
        <PdfPageNumber />
      </Page>
    </Document>
  );
}
