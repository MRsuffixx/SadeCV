"use client";

import {
  ArrowDown,
  ArrowUp,
  Camera,
  ChevronDown,
  Crown,
  Eye,
  Palette,
  Plus,
  Rows3,
  Trash2,
  Type,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { useResumeStore } from "~/app/dash/resumes/[resumeId]/_store/resume-store";
import type {
  ResumeArrayItemMap,
  ResumeArraySection,
} from "~/lib/resume-model";
import { TEMPLATE_DEFINITIONS } from "~/templates/registry";
import {
  FONT_PAIRINGS,
  RESUME_PALETTES,
} from "~/templates/schema";
import { useUploadThing } from "~/utils/uploadthing";

export function ResumeEditorPanels({
  resumeId,
  isPremium,
  uploadsEnabled,
}: {
  resumeId: string;
  isPremium: boolean;
  uploadsEnabled: boolean;
}) {
  return (
    <div className="space-y-3">
      <PersonalInformationPanel
        resumeId={resumeId}
        uploadsEnabled={uploadsEnabled}
      />
      <SummaryPanel />
      <EmploymentPanel />
      <EducationPanel />
      <SkillsPanel />
      <LanguagesPanel />
      <CertificationsPanel />
      <ProjectsPanel />
      <AwardsPanel />
      <VolunteerPanel />
      <PublicationsPanel />
      <ReferencesPanel />
      <HobbiesPanel />
      <CustomSectionsPanel />
      <StylePanel isPremium={isPremium} />
    </div>
  );
}

function PersonalInformationPanel({
  resumeId,
  uploadsEnabled,
}: {
  resumeId: string;
  uploadsEnabled: boolean;
}) {
  const personal = useResumeStore((state) => state.content.personalInformation);
  const setPersonal = useResumeStore((state) => state.setPersonal);
  const setSocial = useResumeStore((state) => state.setSocial);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState("");
  const { startUpload, isUploading } = useUploadThing("resumeAsset", {
    onClientUploadComplete: (files) => {
      const url = files[0]?.serverData.url;
      if (url) setPersonal("avatarUrl", url);
    },
    onUploadError: () =>
      setUploadError("The image could not be uploaded. Please try again."),
  });

  return (
    <SectionPanel
      number="01"
      title="Personal information"
      description="Identity, contact details, and professional links."
      defaultOpen
    >
      <div className="flex items-center gap-3 rounded-2xl bg-[#f1f5f2] p-3">
        <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[#dceae4] text-[#22604f]">
          {personal.avatarUrl ? (
            <Image
              src={personal.avatarUrl}
              alt="CV portrait"
              width={64}
              height={64}
              unoptimized
              className="size-full object-cover"
            />
          ) : (
            <Camera size={20} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold">Profile picture</p>
          <p className="mt-1 text-[10px] leading-4 text-[#7c8681]">
            Uploaded securely; only its cloud URL is saved.
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file) {
              setUploadError("");
              try {
                await startUpload([file], { resumeId });
              } catch {
                setUploadError("The image could not be uploaded. Please try again.");
              }
            }
            event.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={isUploading || !uploadsEnabled}
          onClick={() => inputRef.current?.click()}
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-[10px] font-extrabold disabled:opacity-50"
        >
          {isUploading
            ? "Uploading…"
            : uploadsEnabled
              ? "Upload"
              : "Unavailable"}
        </button>
      </div>
      {uploadError ? (
        <p role="alert" className="text-xs font-bold text-[#a45446]">
          {uploadError}
        </p>
      ) : null}

      <FieldGroup title="Essentials">
        <FieldGrid>
          <Field
            label="First name"
            required
            value={personal.firstName}
            onChange={(value) => setPersonal("firstName", value)}
            placeholder="Alex"
            autoComplete="given-name"
          />
          <Field
            label="Last name"
            required
            value={personal.lastName}
            onChange={(value) => setPersonal("lastName", value)}
            placeholder="Morgan"
            autoComplete="family-name"
          />
          <Field
            label="Email"
            required
            type="email"
            value={personal.email}
            onChange={(value) => setPersonal("email", value)}
            placeholder="alex@example.com"
            autoComplete="email"
          />
          <Field
            label="Primary phone"
            required
            type="tel"
            value={personal.primaryPhone}
            onChange={(value) => setPersonal("primaryPhone", value)}
            placeholder="+90 555 000 00 00"
            autoComplete="tel"
          />
          <Field
            label="City / district"
            required
            value={personal.cityDistrict}
            onChange={(value) => setPersonal("cityDistrict", value)}
            placeholder="Kadıköy, İstanbul"
            autoComplete="address-level2"
          />
          <Field
            label="Country"
            required
            value={personal.country}
            onChange={(value) => setPersonal("country", value)}
            placeholder="Türkiye"
            autoComplete="country-name"
          />
        </FieldGrid>
        <Field
          label="Professional title"
          value={personal.professionalTitle}
          onChange={(value) => setPersonal("professionalTitle", value)}
          placeholder="Senior Product Designer"
        />
      </FieldGroup>

      <FieldGroup title="Additional contact">
        <FieldGrid>
          <Field
            label="Secondary phone"
            type="tel"
            value={personal.secondaryPhone}
            onChange={(value) => setPersonal("secondaryPhone", value)}
            placeholder="Optional"
          />
          <Field
            label="Zip code"
            value={personal.zipCode}
            onChange={(value) => setPersonal("zipCode", value)}
            placeholder="34710"
            autoComplete="postal-code"
          />
        </FieldGrid>
        <TextArea
          label="Full address"
          value={personal.fullAddress}
          onChange={(value) => setPersonal("fullAddress", value)}
          placeholder="Street, building, apartment"
          rows={2}
        />
      </FieldGroup>

      <FieldGroup title="Personal details">
        <FieldGrid>
          <Field
            label="Date of birth"
            type="date"
            value={personal.dateOfBirth}
            onChange={(value) => setPersonal("dateOfBirth", value)}
          />
          <Field
            label="Place of birth"
            value={personal.placeOfBirth}
            onChange={(value) => setPersonal("placeOfBirth", value)}
            placeholder="İstanbul"
          />
          <Field
            label="Nationality"
            value={personal.nationality}
            onChange={(value) => setPersonal("nationality", value)}
            placeholder="Turkish"
          />
          <SelectField
            label="Gender"
            value={personal.gender}
            onChange={(value) =>
              setPersonal("gender", value as typeof personal.gender)
            }
            options={[
              ["", "Not specified"],
              ["FEMALE", "Female"],
              ["MALE", "Male"],
              ["NON_BINARY", "Non-binary"],
              ["OTHER", "Other"],
              ["UNDISCLOSED", "Prefer not to say"],
            ]}
          />
          <SelectField
            label="Marital status"
            value={personal.maritalStatus}
            onChange={(value) =>
              setPersonal(
                "maritalStatus",
                value as typeof personal.maritalStatus,
              )
            }
            options={[
              ["", "Not specified"],
              ["SINGLE", "Single"],
              ["MARRIED", "Married"],
              ["DIVORCED", "Divorced"],
              ["WIDOWED", "Widowed"],
              ["UNDISCLOSED", "Prefer not to say"],
            ]}
          />
          <Field
            label="Driver's license class"
            value={personal.driversLicenseClass}
            onChange={(value) => setPersonal("driversLicenseClass", value)}
            placeholder="B, A2"
          />
          <SelectField
            label="Military service"
            value={personal.militaryServiceStatus}
            onChange={(value) =>
              setPersonal(
                "militaryServiceStatus",
                value as typeof personal.militaryServiceStatus,
              )
            }
            options={[
              ["", "Not specified"],
              ["COMPLETED", "Completed"],
              ["EXEMPT", "Exempt"],
              ["DEFERRED", "Deferred"],
              ["NOT_APPLICABLE", "Not applicable"],
            ]}
          />
          {personal.militaryServiceStatus === "DEFERRED" ? (
            <Field
              label="Deferment date"
              type="date"
              value={personal.militaryDefermentDate}
              onChange={(value) => setPersonal("militaryDefermentDate", value)}
            />
          ) : null}
        </FieldGrid>
      </FieldGroup>

      <FieldGroup title="Socials and links">
        <Field
          label="LinkedIn"
          type="url"
          value={personal.socials.linkedin}
          onChange={(value) => setSocial("linkedin", value)}
          placeholder="https://linkedin.com/in/..."
        />
        <FieldGrid>
          <Field
            label="GitHub / GitLab"
            type="url"
            value={personal.socials.github}
            onChange={(value) => setSocial("github", value)}
            placeholder="https://github.com/..."
          />
          <Field
            label="Website / portfolio"
            type="url"
            value={personal.socials.portfolio}
            onChange={(value) => setSocial("portfolio", value)}
            placeholder="https://yourname.com"
          />
          <Field
            label="Behance / Dribbble"
            type="url"
            value={personal.socials.designPortfolio}
            onChange={(value) => setSocial("designPortfolio", value)}
            placeholder="https://behance.net/..."
          />
          <Field
            label="Skype / Zoom / Discord"
            value={personal.socials.communication}
            onChange={(value) => setSocial("communication", value)}
            placeholder="Username or invite link"
          />
        </FieldGrid>
      </FieldGroup>
    </SectionPanel>
  );
}

function SummaryPanel() {
  const summary = useResumeStore((state) => state.content.professionalSummary);
  const setSummary = useResumeStore((state) => state.setProfessionalSummary);
  return (
    <SectionPanel
      number="02"
      title="Professional summary"
      description="A concise career narrative and objective."
    >
      <TextArea
        label="Summary"
        value={summary}
        onChange={setSummary}
        placeholder="Describe your focus, strongest capabilities, and the value you create."
        rows={8}
        maxLength={8_000}
      />
    </SectionPanel>
  );
}

function EmploymentPanel() {
  const items = useResumeStore((state) => state.content.employmentHistory);
  return (
    <RepeaterPanel
      number="03"
      title="Employment history"
      description="Roles, responsibilities, and measurable achievements."
      section="employmentHistory"
      addLabel="Add employment"
      items={items}
      renderItem={(item) => (
        <>
          <FieldGrid>
            <Field
              label="Company / organization"
              required
              value={item.company}
              onChange={(value) =>
                updateItem("employmentHistory", item.id, { company: value })
              }
              placeholder="Northstar Labs"
            />
            <Field
              label="Job title"
              required
              value={item.jobTitle}
              onChange={(value) =>
                updateItem("employmentHistory", item.id, { jobTitle: value })
              }
              placeholder="Product Design Lead"
            />
            <Field
              label="Start date"
              required
              type="date"
              value={item.startDate}
              onChange={(value) =>
                updateItem("employmentHistory", item.id, { startDate: value })
              }
            />
            {!item.current ? (
              <Field
                label="End date"
                type="date"
                value={item.endDate}
                onChange={(value) =>
                  updateItem("employmentHistory", item.id, { endDate: value })
                }
              />
            ) : null}
          </FieldGrid>
          <CheckboxField
            label="I currently work here"
            checked={item.current}
            onChange={(current) =>
              updateItem("employmentHistory", item.id, {
                current,
                ...(current ? { endDate: "" } : {}),
              })
            }
          />
          <FieldGrid>
            <SelectField
              label="Employment type"
              value={item.employmentType}
              onChange={(value) =>
                updateItem("employmentHistory", item.id, {
                  employmentType: value as typeof item.employmentType,
                })
              }
              options={employmentTypeOptions}
            />
            <SelectField
              label="Work model"
              value={item.workModel}
              onChange={(value) =>
                updateItem("employmentHistory", item.id, {
                  workModel: value as typeof item.workModel,
                })
              }
              options={workModelOptions}
            />
          </FieldGrid>
          <Field
            label="Location"
            value={item.location}
            onChange={(value) =>
              updateItem("employmentHistory", item.id, { location: value })
            }
            placeholder="İstanbul, Türkiye"
          />
          <TextArea
            label="Responsibilities"
            value={item.responsibilities}
            onChange={(value) =>
              updateItem("employmentHistory", item.id, {
                responsibilities: value,
              })
            }
            placeholder="Use one line per responsibility or bullet."
            rows={4}
          />
          <TextArea
            label="Achievements"
            value={item.achievements}
            onChange={(value) =>
              updateItem("employmentHistory", item.id, {
                achievements: value,
              })
            }
            placeholder="Highlight outcomes, metrics, and recognition."
            rows={4}
          />
        </>
      )}
    />
  );
}

function EducationPanel() {
  const items = useResumeStore((state) => state.content.education);
  return (
    <RepeaterPanel
      number="04"
      title="Education"
      description="Degrees, programs, and academic context."
      section="education"
      addLabel="Add education"
      items={items}
      renderItem={(item) => (
        <>
          <Field
            label="Institution"
            required
            value={item.institution}
            onChange={(value) =>
              updateItem("education", item.id, { institution: value })
            }
            placeholder="Boğaziçi University"
          />
          <Field
            label="Degree / program"
            required
            value={item.program}
            onChange={(value) =>
              updateItem("education", item.id, { program: value })
            }
            placeholder="BSc, Computer Engineering"
          />
          <FieldGrid>
            <Field
              label="Start date"
              required
              type="date"
              value={item.startDate}
              onChange={(value) =>
                updateItem("education", item.id, { startDate: value })
              }
            />
            {!item.ongoing ? (
              <Field
                label="Graduation date"
                type="date"
                value={item.graduationDate}
                onChange={(value) =>
                  updateItem("education", item.id, {
                    graduationDate: value,
                  })
                }
              />
            ) : null}
          </FieldGrid>
          <CheckboxField
            label="Ongoing / present"
            checked={item.ongoing}
            onChange={(ongoing) =>
              updateItem("education", item.id, {
                ongoing,
                ...(ongoing ? { graduationDate: "" } : {}),
              })
            }
          />
          <FieldGrid>
            <Field
              label="Degree level"
              value={item.degreeLevel}
              onChange={(value) =>
                updateItem("education", item.id, { degreeLevel: value })
              }
              placeholder="Bachelor's"
            />
            <Field
              label="GPA"
              value={item.gpa}
              onChange={(value) =>
                updateItem("education", item.id, { gpa: value })
              }
              placeholder="3.50 / 4.00"
            />
          </FieldGrid>
          <Field
            label="Location"
            value={item.location}
            onChange={(value) =>
              updateItem("education", item.id, { location: value })
            }
            placeholder="İstanbul, Türkiye"
          />
          <TextArea
            label="Description / thesis topic"
            value={item.description}
            onChange={(value) =>
              updateItem("education", item.id, { description: value })
            }
            placeholder="Thesis, coursework, honors, or relevant detail."
            rows={4}
          />
        </>
      )}
    />
  );
}

function SkillsPanel() {
  const items = useResumeStore((state) => state.content.skills);
  return (
    <RepeaterPanel
      number="05"
      title="Skills"
      description="Capabilities grouped by category and proficiency."
      section="skills"
      addLabel="Add skill"
      items={items}
      compact
      renderItem={(item) => (
        <>
          <Field
            label="Skill name"
            required
            value={item.name}
            onChange={(value) => updateItem("skills", item.id, { name: value })}
            placeholder="Product strategy"
          />
          <FieldGrid>
            <SelectField
              label="Proficiency"
              value={item.proficiency}
              onChange={(value) =>
                updateItem("skills", item.id, {
                  proficiency: value as typeof item.proficiency,
                })
              }
              options={proficiencyOptions}
            />
            <SelectField
              label="Rating"
              value={String(item.rating)}
              onChange={(value) =>
                updateItem("skills", item.id, { rating: Number(value) })
              }
              options={[
                ["0", "Not rated"],
                ["1", "1 / 5"],
                ["2", "2 / 5"],
                ["3", "3 / 5"],
                ["4", "4 / 5"],
                ["5", "5 / 5"],
              ]}
            />
          </FieldGrid>
          <Field
            label="Category"
            value={item.category}
            onChange={(value) =>
              updateItem("skills", item.id, { category: value })
            }
            placeholder="Software, Design, Leadership…"
          />
        </>
      )}
    />
  );
}

function LanguagesPanel() {
  const items = useResumeStore((state) => state.content.languages);
  return (
    <RepeaterPanel
      number="06"
      title="Languages"
      description="General or skill-specific language proficiency."
      section="languages"
      addLabel="Add language"
      items={items}
      compact
      renderItem={(item) => (
        <>
          <FieldGrid>
            <Field
              label="Language"
              required
              value={item.name}
              onChange={(value) =>
                updateItem("languages", item.id, { name: value })
              }
              placeholder="English"
            />
            <SelectField
              label="General level"
              value={item.generalLevel}
              onChange={(value) =>
                updateItem("languages", item.id, {
                  generalLevel: value as typeof item.generalLevel,
                })
              }
              options={languageLevelOptions}
            />
          </FieldGrid>
          <CheckboxField
            label="Specify reading, writing, and speaking separately"
            checked={item.useAdvancedLevels}
            onChange={(useAdvancedLevels) =>
              updateItem("languages", item.id, { useAdvancedLevels })
            }
          />
          {item.useAdvancedLevels ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  ["Reading", "readingLevel"],
                  ["Writing", "writingLevel"],
                  ["Speaking", "speakingLevel"],
                ] as const
              ).map(([label, field]) => (
                <SelectField
                  key={field}
                  label={label}
                  value={item[field]}
                  onChange={(value) =>
                    updateItem("languages", item.id, {
                      [field]: value,
                    })
                  }
                  options={languageLevelOptions}
                />
              ))}
            </div>
          ) : null}
        </>
      )}
    />
  );
}

function CertificationsPanel() {
  const items = useResumeStore((state) => state.content.certifications);
  return (
    <RepeaterPanel
      number="07"
      title="Certifications & courses"
      description="Credentials, issuing bodies, and verification links."
      section="certifications"
      addLabel="Add certification"
      items={items}
      renderItem={(item) => (
        <>
          <Field
            label="Certification name"
            required
            value={item.name}
            onChange={(value) =>
              updateItem("certifications", item.id, { name: value })
            }
            placeholder="AWS Solutions Architect"
          />
          <Field
            label="Issuing organization"
            required
            value={item.issuingOrganization}
            onChange={(value) =>
              updateItem("certifications", item.id, {
                issuingOrganization: value,
              })
            }
            placeholder="Amazon Web Services"
          />
          <FieldGrid>
            <Field
              label="Issue date"
              type="date"
              value={item.issueDate}
              onChange={(value) =>
                updateItem("certifications", item.id, { issueDate: value })
              }
            />
            {!item.doesNotExpire ? (
              <Field
                label="Expiration date"
                type="date"
                value={item.expirationDate}
                onChange={(value) =>
                  updateItem("certifications", item.id, {
                    expirationDate: value,
                  })
                }
              />
            ) : null}
          </FieldGrid>
          <CheckboxField
            label="This credential does not expire"
            checked={item.doesNotExpire}
            onChange={(doesNotExpire) =>
              updateItem("certifications", item.id, {
                doesNotExpire,
                ...(doesNotExpire ? { expirationDate: "" } : {}),
              })
            }
          />
          <FieldGrid>
            <Field
              label="Credential ID"
              value={item.credentialId}
              onChange={(value) =>
                updateItem("certifications", item.id, { credentialId: value })
              }
              placeholder="ABC-123"
            />
            <Field
              label="Credential URL"
              type="url"
              value={item.credentialUrl}
              onChange={(value) =>
                updateItem("certifications", item.id, {
                  credentialUrl: value,
                })
              }
              placeholder="https://..."
            />
          </FieldGrid>
        </>
      )}
    />
  );
}

function ProjectsPanel() {
  const items = useResumeStore((state) => state.content.projects);
  return (
    <RepeaterPanel
      number="08"
      title="Projects"
      description="Selected work, technical stack, and your role."
      section="projects"
      addLabel="Add project"
      items={items}
      renderItem={(item) => (
        <>
          <Field
            label="Project name"
            required
            value={item.name}
            onChange={(value) =>
              updateItem("projects", item.id, { name: value })
            }
            placeholder="SadeCV"
          />
          <Field
            label="Associated company / institution"
            value={item.associatedOrganization}
            onChange={(value) =>
              updateItem("projects", item.id, {
                associatedOrganization: value,
              })
            }
            placeholder="Independent project"
          />
          <FieldGrid>
            <Field
              label="Start date"
              type="date"
              value={item.startDate}
              onChange={(value) =>
                updateItem("projects", item.id, { startDate: value })
              }
            />
            <Field
              label="End date"
              type="date"
              value={item.endDate}
              onChange={(value) =>
                updateItem("projects", item.id, { endDate: value })
              }
            />
          </FieldGrid>
          <Field
            label="Project URL"
            type="url"
            value={item.projectUrl}
            onChange={(value) =>
              updateItem("projects", item.id, { projectUrl: value })
            }
            placeholder="https://..."
          />
          <TagsField
            label="Tech stack"
            value={item.techStack}
            onChange={(techStack) =>
              updateItem("projects", item.id, { techStack })
            }
            placeholder="Next.js, TypeScript, PostgreSQL"
          />
          <TextArea
            label="Description & role"
            value={item.description}
            onChange={(value) =>
              updateItem("projects", item.id, { description: value })
            }
            placeholder="Explain the problem, your contribution, and the result."
            rows={5}
          />
        </>
      )}
    />
  );
}

function AwardsPanel() {
  const items = useResumeStore((state) => state.content.awards);
  return (
    <RepeaterPanel
      number="09"
      title="Awards & honors"
      description="Recognition from organizations and communities."
      section="awards"
      addLabel="Add award"
      items={items}
      renderItem={(item) => (
        <>
          <Field
            label="Award name"
            required
            value={item.name}
            onChange={(value) => updateItem("awards", item.id, { name: value })}
            placeholder="Design Excellence Award"
          />
          <Field
            label="Issuing organization"
            required
            value={item.issuingOrganization}
            onChange={(value) =>
              updateItem("awards", item.id, { issuingOrganization: value })
            }
            placeholder="Awwwards"
          />
          <Field
            label="Date received"
            type="date"
            value={item.dateReceived}
            onChange={(value) =>
              updateItem("awards", item.id, { dateReceived: value })
            }
          />
          <TextArea
            label="Description"
            value={item.description}
            onChange={(value) =>
              updateItem("awards", item.id, { description: value })
            }
            placeholder="Why the recognition matters."
            rows={3}
          />
        </>
      )}
    />
  );
}

function VolunteerPanel() {
  const items = useResumeStore((state) => state.content.volunteerExperience);
  return (
    <RepeaterPanel
      number="10"
      title="Volunteer experience"
      description="Community roles with the same depth as employment."
      section="volunteerExperience"
      addLabel="Add volunteer role"
      items={items}
      renderItem={(item) => (
        <>
          <FieldGrid>
            <Field
              label="Organization"
              required
              value={item.organization}
              onChange={(value) =>
                updateItem("volunteerExperience", item.id, {
                  organization: value,
                })
              }
              placeholder="Open Source Initiative"
            />
            <Field
              label="Role"
              required
              value={item.role}
              onChange={(value) =>
                updateItem("volunteerExperience", item.id, { role: value })
              }
              placeholder="Community mentor"
            />
            <Field
              label="Start date"
              required
              type="date"
              value={item.startDate}
              onChange={(value) =>
                updateItem("volunteerExperience", item.id, {
                  startDate: value,
                })
              }
            />
            {!item.current ? (
              <Field
                label="End date"
                type="date"
                value={item.endDate}
                onChange={(value) =>
                  updateItem("volunteerExperience", item.id, {
                    endDate: value,
                  })
                }
              />
            ) : null}
          </FieldGrid>
          <CheckboxField
            label="I currently volunteer here"
            checked={item.current}
            onChange={(current) =>
              updateItem("volunteerExperience", item.id, {
                current,
                ...(current ? { endDate: "" } : {}),
              })
            }
          />
          <FieldGrid>
            <Field
              label="Location"
              value={item.location}
              onChange={(value) =>
                updateItem("volunteerExperience", item.id, { location: value })
              }
              placeholder="Remote"
            />
            <SelectField
              label="Work model"
              value={item.workModel}
              onChange={(value) =>
                updateItem("volunteerExperience", item.id, {
                  workModel: value as typeof item.workModel,
                })
              }
              options={workModelOptions}
            />
          </FieldGrid>
          <TextArea
            label="Responsibilities"
            value={item.responsibilities}
            onChange={(value) =>
              updateItem("volunteerExperience", item.id, {
                responsibilities: value,
              })
            }
            placeholder="Your scope and contribution."
            rows={4}
          />
          <TextArea
            label="Achievements"
            value={item.achievements}
            onChange={(value) =>
              updateItem("volunteerExperience", item.id, {
                achievements: value,
              })
            }
            placeholder="Outcomes and community impact."
            rows={3}
          />
        </>
      )}
    />
  );
}

function PublicationsPanel() {
  const items = useResumeStore((state) => state.content.publications);
  return (
    <RepeaterPanel
      number="11"
      title="Publications"
      description="Articles, papers, books, and platform contributions."
      section="publications"
      addLabel="Add publication"
      items={items}
      renderItem={(item) => (
        <>
          <Field
            label="Title"
            required
            value={item.title}
            onChange={(value) =>
              updateItem("publications", item.id, { title: value })
            }
            placeholder="Designing resilient product systems"
          />
          <Field
            label="Publisher / journal / platform"
            required
            value={item.publisher}
            onChange={(value) =>
              updateItem("publications", item.id, { publisher: value })
            }
            placeholder="Medium"
          />
          <FieldGrid>
            <Field
              label="Publication date"
              type="date"
              value={item.publicationDate}
              onChange={(value) =>
                updateItem("publications", item.id, {
                  publicationDate: value,
                })
              }
            />
            <Field
              label="URL"
              type="url"
              value={item.url}
              onChange={(value) =>
                updateItem("publications", item.id, { url: value })
              }
              placeholder="https://..."
            />
          </FieldGrid>
          <TextArea
            label="Description"
            value={item.description}
            onChange={(value) =>
              updateItem("publications", item.id, { description: value })
            }
            placeholder="A short abstract or context."
            rows={3}
          />
        </>
      )}
    />
  );
}

function ReferencesPanel() {
  const references = useResumeStore((state) => state.content.references);
  const setAvailable = useResumeStore(
    (state) => state.setReferencesAvailableUponRequest,
  );
  return (
    <SectionPanel
      number="12"
      title="References"
      description="Named references or a localized upon-request statement."
    >
      <CheckboxField
        label="References available upon request"
        checked={references.availableUponRequest}
        onChange={setAvailable}
        emphasized
      />
      {references.availableUponRequest ? (
        <p className="rounded-2xl border border-[#277b67]/15 bg-[#eef6f2] p-4 text-xs leading-5 text-[#38695b]">
          Individual references are hidden from the editor and export. The CV
          will show a single localized “available upon request” statement.
        </p>
      ) : (
        <RepeaterContent
          section="references"
          addLabel="Add reference"
          items={references.items}
          renderItem={(item) => (
            <>
              <FieldGrid>
                <Field
                  label="Full name"
                  required
                  value={item.fullName}
                  onChange={(value) =>
                    updateItem("references", item.id, { fullName: value })
                  }
                  placeholder="Taylor Reed"
                />
                <Field
                  label="Professional title"
                  required
                  value={item.professionalTitle}
                  onChange={(value) =>
                    updateItem("references", item.id, {
                      professionalTitle: value,
                    })
                  }
                  placeholder="VP of Product"
                />
              </FieldGrid>
              <Field
                label="Company"
                value={item.company}
                onChange={(value) =>
                  updateItem("references", item.id, { company: value })
                }
                placeholder="Northstar Labs"
              />
              <FieldGrid>
                <Field
                  label="Phone"
                  type="tel"
                  value={item.phone}
                  onChange={(value) =>
                    updateItem("references", item.id, { phone: value })
                  }
                  placeholder="+90 555 000 00 00"
                />
                <Field
                  label="Email"
                  type="email"
                  value={item.email}
                  onChange={(value) =>
                    updateItem("references", item.id, { email: value })
                  }
                  placeholder="taylor@example.com"
                />
              </FieldGrid>
            </>
          )}
        />
      )}
    </SectionPanel>
  );
}

function HobbiesPanel() {
  const items = useResumeStore((state) => state.content.hobbies);
  return (
    <RepeaterPanel
      number="13"
      title="Hobbies & interests"
      description="Personal interests that add useful context."
      section="hobbies"
      addLabel="Add interest"
      items={items}
      compact
      renderItem={(item) => (
        <>
          <Field
            label="Name"
            required
            value={item.name}
            onChange={(value) =>
              updateItem("hobbies", item.id, { name: value })
            }
            placeholder="Street photography"
          />
          <TextArea
            label="Description"
            value={item.description}
            onChange={(value) =>
              updateItem("hobbies", item.id, { description: value })
            }
            placeholder="Optional context"
            rows={2}
          />
        </>
      )}
    />
  );
}

function CustomSectionsPanel() {
  const items = useResumeStore((state) => state.content.customSections);
  return (
    <RepeaterPanel
      number="14"
      title="Custom sections"
      description="Create sections unique to your profession and story."
      section="customSections"
      addLabel="Add custom section"
      items={items}
      renderItem={(item) => (
        <>
          <Field
            label="Custom title"
            required
            value={item.title}
            onChange={(value) =>
              updateItem("customSections", item.id, { title: value })
            }
            placeholder="Seminars given"
          />
          <TextArea
            label="Content"
            required
            value={item.content}
            onChange={(value) =>
              updateItem("customSections", item.id, { content: value })
            }
            placeholder="Add the details that should appear in this section."
            rows={6}
            maxLength={10_000}
          />
        </>
      )}
    />
  );
}

function StylePanel({ isPremium }: { isPremium: boolean }) {
  const template = useResumeStore((state) => state.selectedTemplateId);
  const theme = useResumeStore((state) => state.theme);
  const setTemplate = useResumeStore((state) => state.setTemplate);
  const setTheme = useResumeStore((state) => state.setTheme);
  return (
    <SectionPanel
      number="Design"
      title="Visual style"
      description="Template and accent choices for preview and PDF."
    >
      <div className="flex items-center gap-2">
        <Eye size={14} className="text-[#277b67]" />
        <span className="field-label mb-0">Template collection</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {TEMPLATE_DEFINITIONS.map((definition) => {
          const previewOnly = definition.isPremium && !isPremium;
          return (
            <button
              key={definition.id}
              type="button"
              onClick={() => setTemplate(definition.id)}
              className={`relative min-h-24 rounded-xl border px-3 py-3 text-left transition ${
                template === definition.id
                  ? "border-[#277b67] bg-[#eaf4ef] text-[#185545]"
                  : "border-black/10 bg-white text-[#68716c]"
              }`}
            >
              {previewOnly ? (
                <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-[#fff2d9] px-1.5 py-1 text-[8px] font-black text-[#8b6226] uppercase">
                  <Crown size={9} /> Preview
                </span>
              ) : null}
              <span className="block pr-12 text-[11px] font-extrabold">
                {definition.name}
              </span>
              <span className="mt-1 block text-[8px] font-black tracking-wider opacity-60 uppercase">
                {definition.category}
              </span>
              <span className="mt-2 block text-[9px] leading-4 font-medium opacity-70">
                {definition.description}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center gap-2">
          <Palette size={14} className="text-[#277b67]" />
          <span className="field-label mb-0">Color palette</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {RESUME_PALETTES.map((palette) => (
            <button
              key={palette.value}
              type="button"
              aria-label={`Use ${palette.name} palette`}
              title={palette.name}
              onClick={() => setTheme("accentColor", palette.value)}
              className={`grid size-9 place-items-center rounded-full border-2 transition ${
                theme.accentColor.toUpperCase() === palette.value
                  ? "border-[#172f28]"
                  : "border-transparent"
              }`}
            >
              <span
                className="size-6 rounded-full shadow-inner"
                style={{ backgroundColor: palette.value }}
              />
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-3 rounded-xl border border-black/10 bg-white p-2">
          <input
            type="color"
            value={theme.accentColor}
            onChange={(event) => setTheme("accentColor", event.target.value)}
            className="size-10 cursor-pointer rounded-lg border-0 bg-transparent"
          />
          <span className="font-mono text-xs font-bold text-[#626b66]">
            {theme.accentColor.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center gap-2">
          <Type size={14} className="text-[#277b67]" />
          <span className="field-label mb-0">Typography pairing</span>
        </div>
        <div className="space-y-2">
          {FONT_PAIRINGS.map((pairing) => (
            <button
              key={pairing.id}
              type="button"
              onClick={() => setTheme("fontPairing", pairing.id)}
              className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left ${
                theme.fontPairing === pairing.id
                  ? "border-[#277b67] bg-[#edf6f1]"
                  : "border-black/10 bg-white"
              }`}
            >
              <span>
                <span className="block text-[11px] font-extrabold">
                  {pairing.name}
                </span>
                <span className="mt-0.5 block text-[9px] text-[#7f8884]">
                  {pairing.description}
                </span>
              </span>
              <span
                className={
                  pairing.id === "INTER" ? "font-sans" : "font-serif"
                }
              >
                Aa
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center gap-2">
          <Rows3 size={14} className="text-[#277b67]" />
          <span className="field-label mb-0">Document density</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(["COMPACT", "BALANCED", "SPACIOUS"] as const).map((spacing) => (
            <button
              key={spacing}
              type="button"
              onClick={() => setTheme("spacing", spacing)}
              className={`rounded-xl border px-2 py-2.5 text-[9px] font-black ${
                theme.spacing === spacing
                  ? "border-[#277b67] bg-[#edf6f1] text-[#185545]"
                  : "border-black/10 bg-white text-[#707975]"
              }`}
            >
              {spacing === "BALANCED" ? "STANDARD" : spacing}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <ThemeToggle
          label="Show visual markers"
          checked={theme.showIcons}
          onChange={(value) => setTheme("showIcons", value)}
        />
        <ThemeToggle
          label="Show profile photo"
          checked={theme.showProfilePhoto}
          onChange={(value) => setTheme("showProfilePhoto", value)}
        />
      </div>
    </SectionPanel>
  );
}

function ThemeToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-black/10 bg-white p-3 text-[10px] font-extrabold">
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 accent-[#277b67]"
      />
    </label>
  );
}

function SectionPanel({
  number,
  title,
  description,
  defaultOpen = false,
  children,
}: {
  number: string;
  title: string;
  description: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="overflow-hidden rounded-[1.25rem] border border-black/[0.08] bg-white shadow-[0_8px_24px_rgba(18,63,53,0.035)]">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 px-4 py-4 text-left sm:px-5"
      >
        <span className="grid min-w-9 place-items-center rounded-lg bg-[#edf4f0] px-2 py-1.5 text-[9px] font-black tracking-wider text-[#277b67] uppercase">
          {number}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-extrabold">{title}</span>
          <span className="mt-0.5 block text-[11px] leading-4 text-[#7d8681]">
            {description}
          </span>
        </span>
        <ChevronDown
          size={17}
          className={`shrink-0 text-[#7b8580] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open ? (
        <div className="space-y-4 border-t border-black/[0.07] px-4 py-5 sm:px-5">
          {children}
        </div>
      ) : null}
    </section>
  );
}

function RepeaterPanel<S extends ResumeArraySection>({
  number,
  title,
  description,
  section,
  addLabel,
  items,
  renderItem,
  compact = false,
}: {
  number: string;
  title: string;
  description: string;
  section: S;
  addLabel: string;
  items: ResumeArrayItemMap[S][];
  renderItem: (item: ResumeArrayItemMap[S], index: number) => ReactNode;
  compact?: boolean;
}) {
  return (
    <SectionPanel number={number} title={title} description={description}>
      <RepeaterContent
        section={section}
        addLabel={addLabel}
        items={items}
        renderItem={renderItem}
        compact={compact}
      />
    </SectionPanel>
  );
}

function RepeaterContent<S extends ResumeArraySection>({
  section,
  addLabel,
  items,
  renderItem,
  compact = false,
}: {
  section: S;
  addLabel: string;
  items: ResumeArrayItemMap[S][];
  renderItem: (item: ResumeArrayItemMap[S], index: number) => ReactNode;
  compact?: boolean;
}) {
  const addItem = useResumeStore((state) => state.addItem);
  const removeItem = useResumeStore((state) => state.removeItem);
  const moveItem = useResumeStore((state) => state.moveItem);
  return (
    <div className="space-y-4">
      {items.length ? (
        items.map((item, index) => (
          <ItemCard
            key={item.id}
            label={`${addLabel.replace(/^Add /, "")} ${index + 1}`}
            onRemove={() => removeItem(section, item.id)}
            onMoveUp={() => moveItem(section, item.id, -1)}
            onMoveDown={() => moveItem(section, item.id, 1)}
            canMoveUp={index > 0}
            canMoveDown={index < items.length - 1}
            compact={compact}
          >
            {renderItem(item, index)}
          </ItemCard>
        ))
      ) : (
        <EmptyState>
          No entries yet. Add one when it strengthens your CV.
        </EmptyState>
      )}
      <button
        type="button"
        onClick={() => addItem(section)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#277b67]/30 bg-[#edf5f1] px-4 py-3 text-xs font-extrabold text-[#246451]"
      >
        <Plus size={15} />
        {addLabel}
      </button>
    </div>
  );
}

function ItemCard({
  label,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  compact,
  children,
}: {
  label: string;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  compact: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <article className="overflow-hidden rounded-2xl border border-black/[0.08] bg-[#fafbf8]">
      <div className="flex items-center gap-2 border-b border-black/[0.06] px-3 py-2.5">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <ChevronDown
            size={14}
            className={`shrink-0 text-[#7d8581] transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
          <span className="truncate text-[10px] font-extrabold tracking-wider text-[#69736e] uppercase">
            {label}
          </span>
        </button>
        <IconButton
          label={`Move ${label} up`}
          disabled={!canMoveUp}
          onClick={onMoveUp}
        >
          <ArrowUp size={13} />
        </IconButton>
        <IconButton
          label={`Move ${label} down`}
          disabled={!canMoveDown}
          onClick={onMoveDown}
        >
          <ArrowDown size={13} />
        </IconButton>
        <IconButton label={`Remove ${label}`} onClick={onRemove} danger>
          <Trash2 size={13} />
        </IconButton>
      </div>
      {open ? (
        <div className={`space-y-3 p-4 ${compact ? "sm:p-3.5" : ""}`}>
          {children}
        </div>
      ) : null}
    </article>
  );
}

function updateItem<S extends ResumeArraySection>(
  section: S,
  id: string,
  patch: Partial<Omit<ResumeArrayItemMap[S], "id">>,
) {
  useResumeStore.getState().updateItem(section, id, patch);
}

function FieldGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3 border-t border-black/[0.06] pt-4 first:border-0 first:pt-0">
      <p className="text-[10px] font-black tracking-[0.12em] text-[#66716c] uppercase">
        {title}
      </p>
      {children}
    </div>
  );
}

function FieldGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function Field({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
  required = false,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block min-w-0">
      <FieldLabel label={label} required={required} />
      <input
        className="field"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows,
  required = false,
  maxLength = 8_000,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows: number;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <FieldLabel label={label} required={required} />
      <textarea
        className="field resize-y leading-6"
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <label className="block min-w-0">
      <FieldLabel label={label} />
      <select
        className="field"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function TagsField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const serialized = value.join(", ");
  const [draft, setDraft] = useState(serialized);

  useEffect(() => {
    if (document.activeElement !== inputRef.current) setDraft(serialized);
  }, [serialized]);

  const commit = () =>
    onChange(
      draft
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    );

  return (
    <label className="block">
      <FieldLabel label={label} />
      <input
        ref={inputRef}
        className="field"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        placeholder={placeholder}
      />
      <span className="mt-1.5 block text-[10px] text-[#89918d]">
        Separate tags with commas.
      </span>
    </label>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
  emphasized = false,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  emphasized?: boolean;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-xs font-bold ${
        emphasized
          ? "border-[#277b67]/20 bg-[#eef6f2] text-[#285f50]"
          : "border-black/[0.07] bg-white text-[#5f6964]"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 accent-[#277b67]"
      />
      <span>{label}</span>
    </label>
  );
}

function FieldLabel({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <span className="field-label">
      {label}
      {required ? <span className="ml-1 text-[#c35d49]">*</span> : null}
    </span>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-black/10 bg-[#fafbf8] px-4 py-5 text-center text-xs leading-5 text-[#818985]">
      {children}
    </p>
  );
}

function IconButton({
  label,
  onClick,
  disabled = false,
  danger = false,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`grid size-7 place-items-center rounded-lg border border-black/[0.07] bg-white disabled:opacity-30 ${
        danger ? "text-[#a45446]" : "text-[#6f7974]"
      }`}
    >
      {children}
    </button>
  );
}

const employmentTypeOptions = [
  ["", "Not specified"],
  ["FULL_TIME", "Full-time"],
  ["PART_TIME", "Part-time"],
  ["FREELANCE", "Freelance"],
  ["CONTRACT", "Contract"],
  ["INTERNSHIP", "Internship"],
  ["TEMPORARY", "Temporary"],
  ["VOLUNTEER", "Volunteer"],
  ["OTHER", "Other"],
] as const;

const workModelOptions = [
  ["", "Not specified"],
  ["REMOTE", "Remote"],
  ["HYBRID", "Hybrid"],
  ["ON_SITE", "On-site"],
] as const;

const proficiencyOptions = [
  ["", "Not specified"],
  ["BEGINNER", "Beginner"],
  ["INTERMEDIATE", "Intermediate"],
  ["ADVANCED", "Advanced"],
  ["EXPERT", "Expert"],
] as const;

const languageLevelOptions = [
  ["", "Not specified"],
  ["A1", "A1"],
  ["A2", "A2"],
  ["B1", "B1"],
  ["B2", "B2"],
  ["C1", "C1"],
  ["C2", "C2"],
  ["BEGINNER", "Beginner"],
  ["ELEMENTARY", "Elementary"],
  ["INTERMEDIATE", "Intermediate"],
  ["ADVANCED", "Advanced"],
  ["PROFESSIONAL", "Professional"],
  ["NATIVE", "Native"],
] as const;
