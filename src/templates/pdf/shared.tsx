import { Link, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";

import type {
  PresentationContact,
  PresentationItem,
  PresentationSection,
  ResumePresentation,
} from "~/templates/presentation";

export const pdfStyles = StyleSheet.create({
  section: { marginBottom: 12 },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  marker: { width: 4, height: 4, borderRadius: 1 },
  sectionTitle: {
    fontSize: 7.2,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  item: { marginBottom: 7 },
  itemHead: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  itemTitle: { flexGrow: 1, fontSize: 8.5, fontFamily: "Helvetica-Bold" },
  itemMeta: { maxWidth: "42%", fontSize: 6.3, lineHeight: 1.35, color: "#78817d", textAlign: "right" },
  subtitle: { marginTop: 1.5, fontSize: 7, fontFamily: "Helvetica-Bold" },
  body: { marginTop: 2.5, fontSize: 7.3, lineHeight: 1.48, color: "#555f5a" },
  bulletRow: { flexDirection: "row", marginTop: 2.2, paddingRight: 3 },
  bullet: { width: 8, fontSize: 7, color: "#606a65" },
  bulletText: { flexGrow: 1, fontSize: 7.3, lineHeight: 1.45, color: "#555f5a" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 3, marginTop: 3 },
  tag: { borderRadius: 8, backgroundColor: "#edf1ee", paddingHorizontal: 5, paddingVertical: 2, fontSize: 5.8, color: "#5d6762" },
  contactWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  contactItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  contactMarker: { width: 3, height: 3, borderRadius: 3 },
  contactText: { fontSize: 6.4, color: "#66706b" },
  skill: { marginBottom: 5 },
  skillHead: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
  skillName: { fontSize: 7, fontFamily: "Helvetica-Bold" },
  skillMeta: { fontSize: 5.8, color: "#7c8580" },
  skillTrack: { height: 2.5, marginTop: 2.5, borderRadius: 2, backgroundColor: "#dfe5e1" },
  skillBar: { height: 2.5, borderRadius: 2 },
  footer: { position: "absolute", right: 32, bottom: 20, fontSize: 5.6, color: "#9aa19d" },
});

export function getPdfTheme(presentation: ResumePresentation) {
  const fonts = {
    INTER: { body: "Helvetica", heading: "Helvetica-Bold" },
    CLASSIC_SERIF: { body: "Times-Roman", heading: "Times-Bold" },
    EDITORIAL_SERIF: { body: "Helvetica", heading: "Times-Bold" },
  }[presentation.theme.fontPairing];
  const density = {
    COMPACT: { sectionGap: 8, lineHeight: 1.32, pagePadding: 32 },
    BALANCED: { sectionGap: 12, lineHeight: 1.48, pagePadding: 38 },
    SPACIOUS: { sectionGap: 16, lineHeight: 1.62, pagePadding: 43 },
  }[presentation.theme.spacing];
  return { ...fonts, ...density };
}

export function PdfContactList({
  items,
  presentation,
  inverse = false,
}: {
  items: PresentationContact[];
  presentation: ResumePresentation;
  inverse?: boolean;
}) {
  return (
    <View style={pdfStyles.contactWrap}>
      {items.map((item) => (
        <View key={item.id} style={pdfStyles.contactItem}>
          {presentation.theme.showIcons ? (
            <View
              style={[
                pdfStyles.contactMarker,
                {
                  backgroundColor: inverse
                    ? "#ffffffaa"
                    : presentation.theme.accentColor,
                },
              ]}
            />
          ) : null}
          {item.href ? (
            <Link
              src={item.href}
              style={[
                pdfStyles.contactText,
                inverse ? { color: "#ffffffcc" } : {},
              ]}
            >
              {item.value}
            </Link>
          ) : (
            <Text
              style={[
                pdfStyles.contactText,
                inverse ? { color: "#ffffffcc" } : {},
              ]}
            >
              {item.value}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

export function PdfSection({
  section,
  presentation,
  children,
  inverse = false,
  numbered = false,
}: {
  section: PresentationSection;
  presentation: ResumePresentation;
  children?: ReactNode;
  inverse?: boolean;
  numbered?: boolean;
}) {
  const theme = getPdfTheme(presentation);
  return (
    <View style={[pdfStyles.section, { marginBottom: theme.sectionGap }]}>
      <View style={pdfStyles.sectionTitleRow}>
        {presentation.theme.showIcons ? (
          <View
            style={[
              pdfStyles.marker,
              {
                backgroundColor: inverse
                  ? "#ffffffaa"
                  : presentation.theme.accentColor,
              },
            ]}
          />
        ) : null}
        <Text
          style={[
            pdfStyles.sectionTitle,
            {
              color: inverse ? "#ffffff" : presentation.theme.accentColor,
              fontFamily: theme.heading,
            },
          ]}
        >
          {section.title}
        </Text>
      </View>
      {children ?? (
        <PdfSectionItems
          section={section}
          presentation={presentation}
          inverse={inverse}
          numbered={numbered}
        />
      )}
    </View>
  );
}

export function PdfSectionItems({
  section,
  presentation,
  inverse = false,
  numbered = false,
}: {
  section: PresentationSection;
  presentation: ResumePresentation;
  inverse?: boolean;
  numbered?: boolean;
}) {
  if (section.kind === "SKILLS") {
    return (
      <View>
        {section.items.map((item) => (
          <PdfSkill key={item.id} item={item} presentation={presentation} inverse={inverse} />
        ))}
      </View>
    );
  }
  return (
    <View>
      {section.items.map((item, index) => (
        <PdfItem
          key={item.id}
          item={item}
          presentation={presentation}
          kind={section.kind}
          inverse={inverse}
          number={numbered ? index + 1 : undefined}
        />
      ))}
    </View>
  );
}

function PdfItem({
  item,
  presentation,
  kind,
  inverse,
  number,
}: {
  item: PresentationItem;
  presentation: ResumePresentation;
  kind: PresentationSection["kind"];
  inverse: boolean;
  number?: number;
}) {
  const theme = getPdfTheme(presentation);
  const bodyColor = inverse ? "#ffffffbf" : "#555f5a";
  return (
    <View style={pdfStyles.item} wrap={kind === "TEXT"}>
      <View style={pdfStyles.itemHead}>
        <View style={{ flexGrow: 1 }}>
          {item.title ? (
            <Text
              style={[
                pdfStyles.itemTitle,
                {
                  color: inverse ? "#ffffff" : "#25302b",
                  fontFamily: theme.heading,
                },
              ]}
            >
              {number ? `${String(number).padStart(2, "0")}  ` : ""}
              {item.title}
            </Text>
          ) : null}
          {item.subtitle ? (
            <Text
              style={[
                pdfStyles.subtitle,
                {
                  color: inverse
                    ? "#ffffffb8"
                    : presentation.theme.accentColor,
                  fontFamily: theme.heading,
                },
              ]}
            >
              {item.subtitle}
            </Text>
          ) : null}
        </View>
        {item.meta ? (
          <Text
            style={[
              pdfStyles.itemMeta,
              inverse ? { color: "#ffffff8f" } : {},
            ]}
          >
            {item.meta}
          </Text>
        ) : null}
      </View>
      {item.body.map((paragraph, index) =>
        kind === "TIMELINE" ? (
          <View key={`${item.id}-${index}`} style={pdfStyles.bulletRow}>
            <Text style={[pdfStyles.bullet, { color: bodyColor }]}>•</Text>
            <Text
              style={[
                pdfStyles.bulletText,
                { color: bodyColor, fontFamily: theme.body, lineHeight: theme.lineHeight },
              ]}
            >
              {paragraph}
            </Text>
          </View>
        ) : (
          <Text
            key={`${item.id}-${index}`}
            style={[
              pdfStyles.body,
              { color: bodyColor, fontFamily: theme.body, lineHeight: theme.lineHeight },
            ]}
          >
            {paragraph}
          </Text>
        ),
      )}
      {item.tags.length ? (
        <View style={pdfStyles.tagRow}>
          {item.tags.map((tag) => (
            <Text
              key={tag}
              style={[
                pdfStyles.tag,
                inverse
                  ? { backgroundColor: "#ffffff1f", color: "#ffffffb8" }
                  : {},
              ]}
            >
              {tag}
            </Text>
          ))}
        </View>
      ) : null}
      {item.url ? (
        <Link
          src={item.url}
          style={{ marginTop: 2, fontSize: 5.8, color: inverse ? "#ffffffaa" : presentation.theme.accentColor }}
        >
          {item.url}
        </Link>
      ) : null}
    </View>
  );
}

function PdfSkill({
  item,
  presentation,
  inverse,
}: {
  item: PresentationItem;
  presentation: ResumePresentation;
  inverse: boolean;
}) {
  const theme = getPdfTheme(presentation);
  return (
    <View style={pdfStyles.skill} wrap={false}>
      <View style={pdfStyles.skillHead}>
        <Text style={[pdfStyles.skillName, { color: inverse ? "#ffffff" : "#34413b", fontFamily: theme.heading }]}>{item.title}</Text>
        {item.meta ? <Text style={[pdfStyles.skillMeta, inverse ? { color: "#ffffff8f" } : {}]}>{item.meta}</Text> : null}
      </View>
      {item.progress ? (
        <View style={[pdfStyles.skillTrack, inverse ? { backgroundColor: "#ffffff26" } : {}]}>
          <View style={[pdfStyles.skillBar, { width: `${item.progress}%`, backgroundColor: inverse ? "#ffffffb8" : presentation.theme.accentColor }]} />
        </View>
      ) : null}
    </View>
  );
}

export function PdfPageNumber({ inverse = false }: { inverse?: boolean }) {
  return (
    <Text
      fixed
      style={[pdfStyles.footer, inverse ? { color: "#ffffff80" } : {}]}
      render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
    />
  );
}
