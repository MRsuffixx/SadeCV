import {
  Document,
  Image,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ReactNode } from "react";

import {
  getResumeDisplayName,
  type ResumeContent,
  type ResumeTemplate,
} from "~/lib/resume-model";

export type ResumePdfData = {
  title: string;
  template: ResumeTemplate;
  accentColor: string;
  content: ResumeContent;
};

const styles = StyleSheet.create({
  page: { padding: 38, backgroundColor: "#ffffff", color: "#1f2623" },
  header: { borderBottomWidth: 2, paddingBottom: 16 },
  editorialHeader: { borderLeftWidth: 4, paddingLeft: 17, paddingBottom: 4 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
  },
  name: { fontSize: 30, fontFamily: "Helvetica-Bold", letterSpacing: -1.1 },
  headline: {
    marginTop: 7,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.6,
    color: "#d65e48",
    textTransform: "uppercase",
  },
  columns: { flexDirection: "row", gap: 25, paddingTop: 20 },
  aside: { width: "29%" },
  main: { width: "71%" },
  photo: { width: 62, height: 62, borderRadius: 13 },
  section: { marginBottom: 17 },
  sectionHeading: {
    fontSize: 7.6,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.25,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  body: { fontSize: 8.1, lineHeight: 1.52, color: "#59625e" },
  bodyStrong: {
    fontSize: 8.1,
    lineHeight: 1.45,
    color: "#39413d",
    fontFamily: "Helvetica-Bold",
  },
  small: { fontSize: 7.3, lineHeight: 1.46, color: "#626c67" },
  tiny: { fontSize: 6.6, lineHeight: 1.4, color: "#7b847f" },
  link: { color: "#4d6960", textDecoration: "none" },
  skillRow: { flexDirection: "row", flexWrap: "wrap" },
  skill: {
    fontSize: 6.8,
    color: "#52605a",
    backgroundColor: "#eef2ef",
    borderRadius: 7,
    paddingVertical: 3.5,
    paddingHorizontal: 6,
    marginRight: 4,
    marginBottom: 4,
  },
  item: { marginBottom: 12 },
  itemHead: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  itemTitle: { fontSize: 8.9, fontFamily: "Helvetica-Bold", flexGrow: 1 },
  period: {
    maxWidth: "38%",
    fontSize: 6.7,
    fontFamily: "Helvetica-Bold",
    color: "#828985",
    textAlign: "right",
  },
  organization: {
    marginTop: 2.5,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#d65e48",
  },
  description: { marginTop: 4 },
  metadata: { marginTop: 2, fontSize: 6.8, color: "#7a837f" },
  bulletRow: { flexDirection: "row", gap: 5, marginBottom: 2 },
  bullet: { width: 7, fontSize: 7.5, color: "#59625e" },
  bulletText: {
    flexGrow: 1,
    fontSize: 8.1,
    lineHeight: 1.46,
    color: "#59625e",
  },
});

export function ResumePdfDocument({ data }: { data: ResumePdfData }) {
  const { content, accentColor, template } = data;
  const personal = content.personalInformation;
  const displayName = getResumeDisplayName(content) || "Your name";
  const mono = template === "MONO";
  const pageFont = mono ? "Courier" : "Helvetica";
  const contactLines = [
    personal.email,
    personal.primaryPhone,
    personal.secondaryPhone,
    personal.cityDistrict,
    personal.country,
    personal.fullAddress,
    personal.zipCode,
  ].filter(Boolean);
  const links = [
    personal.socials.linkedin,
    personal.socials.github,
    personal.socials.portfolio,
    personal.socials.designPortfolio,
  ].filter(Boolean);

  return (
    <Document title={data.title} author={displayName || "SadeCV user"}>
      <Page size="A4" style={[styles.page, { fontFamily: pageFont }]}>
        <View
          style={[
            template === "EDITORIAL" ? styles.editorialHeader : styles.header,
            { borderColor: accentColor },
          ]}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.name, { color: accentColor }]}>
                {displayName}
              </Text>
              <Text style={styles.headline}>
                {personal.professionalTitle || "Professional title"}
              </Text>
            </View>
            {personal.avatarUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image is not a DOM image and has no alt prop.
              <Image src={personal.avatarUrl} style={styles.photo} />
            ) : null}
          </View>
        </View>

        <View style={styles.columns}>
          <View style={styles.aside}>
            {contactLines.length ? (
              <PdfSection title="Contact" color={accentColor}>
                {contactLines.map((line, index) => (
                  <Text key={`${line}-${index}`} style={styles.small}>
                    {line}
                  </Text>
                ))}
              </PdfSection>
            ) : null}

            {links.length || personal.socials.communication ? (
              <PdfSection title="Links" color={accentColor}>
                {links.map((url) => (
                  <Link key={url} src={url} style={[styles.small, styles.link]}>
                    {shortenUrl(url)}
                  </Link>
                ))}
                {personal.socials.communication ? (
                  <Text style={styles.small}>
                    {personal.socials.communication}
                  </Text>
                ) : null}
              </PdfSection>
            ) : null}

            {content.skills.length ? (
              <PdfSection title="Skills" color={accentColor}>
                <View style={styles.skillRow}>
                  {content.skills.map((skill) => (
                    <Text key={skill.id} style={styles.skill}>
                      {skill.name}
                      {skill.rating ? ` · ${skill.rating}/5` : ""}
                    </Text>
                  ))}
                </View>
              </PdfSection>
            ) : null}

            {content.languages.length ? (
              <PdfSection title="Languages" color={accentColor}>
                {content.languages.map((language) => (
                  <View
                    key={language.id}
                    style={{ marginBottom: 7 }}
                    wrap={false}
                  >
                    <Text style={styles.bodyStrong}>{language.name}</Text>
                    <Text style={styles.tiny}>
                      {language.useAdvancedLevels
                        ? [
                            `Reading ${language.readingLevel || "—"}`,
                            `Writing ${language.writingLevel || "—"}`,
                            `Speaking ${language.speakingLevel || "—"}`,
                          ].join(" · ")
                        : language.generalLevel}
                    </Text>
                  </View>
                ))}
              </PdfSection>
            ) : null}

            {content.education.length ? (
              <PdfSection title="Education" color={accentColor}>
                {content.education.map((item) => (
                  <View key={item.id} style={styles.item} wrap={false}>
                    <Text style={styles.bodyStrong}>{item.program}</Text>
                    <Text style={styles.small}>{item.institution}</Text>
                    <Text style={styles.tiny}>
                      {[
                        formatPeriod(
                          item.startDate,
                          item.graduationDate,
                          item.ongoing,
                        ),
                        item.location,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </Text>
                    {item.gpa ? (
                      <Text style={styles.tiny}>GPA {item.gpa}</Text>
                    ) : null}
                    {item.description ? (
                      <Text style={[styles.tiny, { marginTop: 2 }]}>
                        {item.description}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </PdfSection>
            ) : null}

            {content.certifications.length ? (
              <PdfSection title="Credentials" color={accentColor}>
                {content.certifications.map((item) => (
                  <View key={item.id} style={styles.item} wrap={false}>
                    <Text style={styles.bodyStrong}>{item.name}</Text>
                    <Text style={styles.small}>{item.issuingOrganization}</Text>
                    <Text style={styles.tiny}>
                      {[
                        formatDate(item.issueDate),
                        item.doesNotExpire
                          ? "No expiration"
                          : formatDate(item.expirationDate),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </Text>
                    {item.credentialUrl ? (
                      <Link
                        src={item.credentialUrl}
                        style={[styles.tiny, styles.link]}
                      >
                        Verify credential
                      </Link>
                    ) : null}
                  </View>
                ))}
              </PdfSection>
            ) : null}

            {hasPersonalDetails(content) ? (
              <PdfSection title="Details" color={accentColor}>
                {personal.nationality ? (
                  <Text style={styles.small}>{personal.nationality}</Text>
                ) : null}
                {personal.dateOfBirth ? (
                  <Text style={styles.small}>
                    Born {formatDate(personal.dateOfBirth)}
                  </Text>
                ) : null}
                {personal.placeOfBirth ? (
                  <Text style={styles.small}>{personal.placeOfBirth}</Text>
                ) : null}
                {personal.driversLicenseClass ? (
                  <Text style={styles.small}>
                    License {personal.driversLicenseClass}
                  </Text>
                ) : null}
                {personal.militaryServiceStatus ? (
                  <Text style={styles.small}>
                    Military: {humanize(personal.militaryServiceStatus)}
                    {personal.militaryDefermentDate
                      ? ` until ${formatDate(personal.militaryDefermentDate)}`
                      : ""}
                  </Text>
                ) : null}
              </PdfSection>
            ) : null}
          </View>

          <View style={styles.main}>
            {content.professionalSummary ? (
              <PdfSection title="Profile" color={accentColor}>
                <Text style={styles.body}>{content.professionalSummary}</Text>
              </PdfSection>
            ) : null}

            {content.employmentHistory.length ? (
              <PdfSection title="Employment" color={accentColor}>
                {content.employmentHistory.map((item) => (
                  <PdfEntry
                    key={item.id}
                    title={item.jobTitle}
                    organization={item.company}
                    meta={[
                      formatPeriod(item.startDate, item.endDate, item.current),
                      item.location,
                      humanize(item.workModel),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  >
                    <PdfTextBlocks
                      values={[item.responsibilities, item.achievements]}
                    />
                  </PdfEntry>
                ))}
              </PdfSection>
            ) : null}

            {content.projects.length ? (
              <PdfSection title="Projects" color={accentColor}>
                {content.projects.map((item) => (
                  <PdfEntry
                    key={item.id}
                    title={item.name}
                    organization={item.associatedOrganization}
                    meta={formatPeriod(item.startDate, item.endDate, false)}
                  >
                    {item.description ? (
                      <Text style={styles.body}>{item.description}</Text>
                    ) : null}
                    {item.techStack.length ? (
                      <Text style={styles.metadata}>
                        {item.techStack.join(" · ")}
                      </Text>
                    ) : null}
                    {item.projectUrl ? (
                      <Link
                        src={item.projectUrl}
                        style={[styles.metadata, styles.link]}
                      >
                        {shortenUrl(item.projectUrl)}
                      </Link>
                    ) : null}
                  </PdfEntry>
                ))}
              </PdfSection>
            ) : null}

            {content.volunteerExperience.length ? (
              <PdfSection title="Volunteer experience" color={accentColor}>
                {content.volunteerExperience.map((item) => (
                  <PdfEntry
                    key={item.id}
                    title={item.role}
                    organization={item.organization}
                    meta={[
                      formatPeriod(item.startDate, item.endDate, item.current),
                      item.location,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  >
                    <PdfTextBlocks
                      values={[item.responsibilities, item.achievements]}
                    />
                  </PdfEntry>
                ))}
              </PdfSection>
            ) : null}

            {content.awards.length ? (
              <PdfCompactSection
                title="Awards & honors"
                color={accentColor}
                items={content.awards.map((item) => ({
                  id: item.id,
                  title: item.name,
                  meta: [
                    item.issuingOrganization,
                    formatDate(item.dateReceived),
                  ]
                    .filter(Boolean)
                    .join(" · "),
                  description: item.description,
                }))}
              />
            ) : null}

            {content.publications.length ? (
              <PdfCompactSection
                title="Publications"
                color={accentColor}
                items={content.publications.map((item) => ({
                  id: item.id,
                  title: item.title,
                  meta: [item.publisher, formatDate(item.publicationDate)]
                    .filter(Boolean)
                    .join(" · "),
                  description: item.description,
                  url: item.url,
                }))}
              />
            ) : null}

            {content.references.availableUponRequest ? (
              <PdfSection title="References" color={accentColor}>
                <Text style={styles.bodyStrong}>
                  References available upon request.
                </Text>
              </PdfSection>
            ) : content.references.items.length ? (
              <PdfCompactSection
                title="References"
                color={accentColor}
                items={content.references.items.map((item) => ({
                  id: item.id,
                  title: item.fullName,
                  meta: [item.professionalTitle, item.company]
                    .filter(Boolean)
                    .join(" · "),
                  description: [item.email, item.phone]
                    .filter(Boolean)
                    .join(" · "),
                }))}
              />
            ) : null}

            {content.hobbies.length ? (
              <PdfCompactSection
                title="Hobbies & interests"
                color={accentColor}
                items={content.hobbies.map((item) => ({
                  id: item.id,
                  title: item.name,
                  description: item.description,
                }))}
              />
            ) : null}

            {content.customSections.map((item) => (
              <PdfSection
                key={item.id}
                title={item.title || "Custom section"}
                color={accentColor}
              >
                <Text style={styles.body}>{item.content}</Text>
              </PdfSection>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
}

function PdfSection({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionHeading, { color }]}>{title}</Text>
      {children}
    </View>
  );
}

function PdfEntry({
  title,
  organization,
  meta,
  children,
}: {
  title: string;
  organization: string;
  meta: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.item} wrap={false}>
      <View style={styles.itemHead}>
        <Text style={styles.itemTitle}>{title}</Text>
        {meta ? <Text style={styles.period}>{meta}</Text> : null}
      </View>
      {organization ? (
        <Text style={styles.organization}>{organization}</Text>
      ) : null}
      <View style={styles.description}>{children}</View>
    </View>
  );
}

function PdfTextBlocks({ values }: { values: string[] }) {
  return (
    <View>
      {values.filter(Boolean).flatMap((value, groupIndex) =>
        value
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line, index) => (
            <View
              key={`${groupIndex}-${index}-${line.slice(0, 16)}`}
              style={styles.bulletRow}
            >
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>{line}</Text>
            </View>
          )),
      )}
    </View>
  );
}

function PdfCompactSection({
  title,
  color,
  items,
}: {
  title: string;
  color: string;
  items: {
    id: string;
    title: string;
    meta?: string;
    description?: string;
    url?: string;
  }[];
}) {
  return (
    <PdfSection title={title} color={color}>
      {items.map((item) => (
        <View key={item.id} style={styles.item} wrap={false}>
          <Text style={styles.bodyStrong}>{item.title}</Text>
          {item.meta ? <Text style={styles.metadata}>{item.meta}</Text> : null}
          {item.description ? (
            <Text style={[styles.body, { marginTop: 3 }]}>
              {item.description}
            </Text>
          ) : null}
          {item.url ? (
            <Link src={item.url} style={[styles.metadata, styles.link]}>
              {shortenUrl(item.url)}
            </Link>
          ) : null}
        </View>
      ))}
    </PdfSection>
  );
}

function formatDate(value: string) {
  if (!value) return "";
  const [year, month] = value.split("-");
  return [month, year].filter(Boolean).join("/");
}

function formatPeriod(start: string, end: string, current: boolean) {
  return [formatDate(start), current ? "Present" : formatDate(end)]
    .filter(Boolean)
    .join(" — ");
}

function humanize(value: string) {
  return value
    ? value
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/^./, (letter) => letter.toUpperCase())
    : "";
}

function shortenUrl(value: string) {
  return value.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function hasPersonalDetails(content: ResumeContent) {
  const personal = content.personalInformation;
  return Boolean(
    personal.nationality ||
    personal.dateOfBirth ||
    personal.placeOfBirth ||
    personal.driversLicenseClass ||
    personal.militaryServiceStatus,
  );
}
