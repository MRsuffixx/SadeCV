import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import type { ResumeContent, ResumeTemplate } from "~/lib/resume-model";

export type ResumePdfData = {
  title: string;
  template: ResumeTemplate;
  accentColor: string;
  content: ResumeContent;
};

const styles = StyleSheet.create({
  page: { padding: 42, backgroundColor: "#ffffff", color: "#1f2623" },
  header: { borderBottomWidth: 2, paddingBottom: 18 },
  editorialHeader: { borderLeftWidth: 4, paddingLeft: 18, paddingBottom: 4 },
  name: { fontSize: 32, fontFamily: "Helvetica-Bold", letterSpacing: -1.2 },
  headline: {
    marginTop: 8,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.8,
    color: "#d65e48",
    textTransform: "uppercase",
  },
  columns: { flexDirection: "row", gap: 28, paddingTop: 22 },
  aside: { width: "29%" },
  main: { width: "71%" },
  photo: { width: 64, height: 64, borderRadius: 14, marginBottom: 18 },
  sectionHeading: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.3,
    textTransform: "uppercase",
    marginBottom: 9,
  },
  body: { fontSize: 8.4, lineHeight: 1.55, color: "#59625e" },
  contact: { fontSize: 7.8, lineHeight: 1.5, color: "#68716d" },
  section: { marginBottom: 21 },
  skill: {
    fontSize: 7.2,
    color: "#52605a",
    backgroundColor: "#eef2ef",
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 7,
    marginRight: 4,
    marginBottom: 4,
  },
  skillRow: { flexDirection: "row", flexWrap: "wrap" },
  item: { marginBottom: 14 },
  itemHead: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  itemTitle: { fontSize: 9.2, fontFamily: "Helvetica-Bold", flexGrow: 1 },
  period: { fontSize: 7.2, fontFamily: "Helvetica-Bold", color: "#828985" },
  company: {
    marginTop: 3,
    fontSize: 7.8,
    fontFamily: "Helvetica-Bold",
    color: "#d65e48",
  },
  education: { fontSize: 8.2, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  educationMeta: { fontSize: 7.4, color: "#68716d", lineHeight: 1.45 },
});

export function ResumePdfDocument({ data }: { data: ResumePdfData }) {
  const { content, accentColor, template } = data;
  const mono = template === "MONO";
  const pageFont = mono ? "Courier" : "Helvetica";

  return (
    <Document title={data.title} author={content.basics.name || "SadeCV user"}>
      <Page size="A4" style={[styles.page, { fontFamily: pageFont }]}>
        <View
          style={[
            template === "EDITORIAL" ? styles.editorialHeader : styles.header,
            { borderColor: accentColor },
          ]}
        >
          <Text style={[styles.name, { color: accentColor }]}>
            {content.basics.name || "Your name"}
          </Text>
          <Text style={styles.headline}>
            {content.basics.headline || "Your professional headline"}
          </Text>
        </View>
        <View style={styles.columns}>
          <View style={styles.aside}>
            {content.basics.imageUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image is not a DOM image and has no alt prop.
              <Image src={content.basics.imageUrl} style={styles.photo} />
            ) : null}
            <View style={styles.section}>
              <Text style={[styles.sectionHeading, { color: accentColor }]}>
                Contact
              </Text>
              <Text style={styles.contact}>
                {content.basics.email || "you@example.com"}
              </Text>
            </View>
            <View style={styles.section}>
              <Text style={[styles.sectionHeading, { color: accentColor }]}>
                Skills
              </Text>
              <View style={styles.skillRow}>
                {(content.skills.length
                  ? content.skills
                  : ["Your", "Key", "Skills"]
                ).map((skill) => (
                  <Text key={skill} style={styles.skill}>
                    {skill}
                  </Text>
                ))}
              </View>
            </View>
            {content.education.length ? (
              <View style={styles.section}>
                <Text style={[styles.sectionHeading, { color: accentColor }]}>
                  Education
                </Text>
                {content.education.map((item) => (
                  <View key={item.id} style={styles.item} wrap={false}>
                    <Text style={styles.education}>
                      {item.degree || "Degree"}
                    </Text>
                    <Text style={styles.educationMeta}>{item.school}</Text>
                    <Text style={styles.educationMeta}>{item.period}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
          <View style={styles.main}>
            <View style={styles.section}>
              <Text style={[styles.sectionHeading, { color: accentColor }]}>
                Profile
              </Text>
              <Text style={styles.body}>
                {content.basics.summary ||
                  "A focused summary of the value you bring, the problems you solve, and the work you want to do next."}
              </Text>
            </View>
            <View>
              <Text style={[styles.sectionHeading, { color: accentColor }]}>
                Experience
              </Text>
              {(content.experience.length
                ? content.experience
                : [
                    {
                      id: "placeholder",
                      role: "Your latest role",
                      company: "Company",
                      period: "Dates",
                      description:
                        "Describe the outcome and impact of your work.",
                    },
                  ]
              ).map((item) => (
                <View key={item.id} style={styles.item} wrap={false}>
                  <View style={styles.itemHead}>
                    <Text style={styles.itemTitle}>
                      {item.role || "Role title"}
                    </Text>
                    <Text style={styles.period}>{item.period}</Text>
                  </View>
                  <Text style={styles.company}>{item.company}</Text>
                  <Text style={[styles.body, { marginTop: 5 }]}>
                    {item.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
