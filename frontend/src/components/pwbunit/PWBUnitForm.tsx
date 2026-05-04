import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  User,
  Briefcase,
  GraduationCap,
  FolderOpen,
  Award,
  Globe,
  Languages,
  Link2,
  Image,
  Star,
  Save,
  Palette,
} from 'lucide-react';
import { Tabs } from '../ui/Tabs';
import { Button } from '../ui/Button';
import { BasicInfoSection } from './sections/BasicInfoSection';
import { SkillsSection } from './sections/SkillsSection';
import { LinksSection } from './sections/LinksSection';
import { LanguagesSection } from './sections/LanguagesSection';
import { ExperienceSection } from './sections/ExperienceSection';
import { EducationSection } from './sections/EducationSection';
import { PortfolioSection } from './sections/PortfolioSection';
import { CertificationsSection } from './sections/CertificationsSection';
import { AwardsSection } from './sections/AwardsSection';
import { CustomSectionsSection } from './sections/CustomSectionsSection';
import { PhotosSection } from './sections/PhotosSection';
import { TemplateSection } from './sections/TemplateSection';
import type { PWBUnit, PWBUnitUpdatePayload } from '../../types/api';

export type PWBUnitFormData = PWBUnitUpdatePayload & {
  first_name: string;
  last_name: string;
  headline: string;
  email: string;
};

interface PWBUnitFormProps {
  unit: PWBUnit;
  onSave: (data: PWBUnitUpdatePayload) => Promise<void>;
  saving: boolean;
}

const tabs = [
  { id: 'basic', label: 'Basic info', icon: <User className="h-4 w-4" /> },
  { id: 'skills', label: 'Skills', icon: <Star className="h-4 w-4" /> },
  { id: 'experience', label: 'Experience', icon: <Briefcase className="h-4 w-4" /> },
  { id: 'education', label: 'Education', icon: <GraduationCap className="h-4 w-4" /> },
  { id: 'portfolio', label: 'Portfolio', icon: <FolderOpen className="h-4 w-4" /> },
  { id: 'certifications', label: 'Certifications', icon: <Award className="h-4 w-4" /> },
  { id: 'awards', label: 'Awards', icon: <Award className="h-4 w-4" /> },
  { id: 'languages', label: 'Languages', icon: <Languages className="h-4 w-4" /> },
  { id: 'links', label: 'Links', icon: <Link2 className="h-4 w-4" /> },
  { id: 'custom', label: 'Custom', icon: <Globe className="h-4 w-4" /> },
  { id: 'media', label: 'Photos & Media', icon: <Image className="h-4 w-4" /> },
  { id: 'template', label: 'Template', icon: <Palette className="h-4 w-4" /> },
];

function nullify<T>(val: T | '' | undefined): T | null {
  if (val === '' || val === undefined) return null;
  return val ?? null;
}

export function PWBUnitForm({ unit, onSave, saving }: PWBUnitFormProps) {
  const [activeTab, setActiveTab] = useState('basic');

  const form = useForm<PWBUnitFormData>({
    defaultValues: {
      first_name: unit.first_name,
      last_name: unit.last_name,
      headline: unit.headline,
      email: unit.email,
      phone: unit.phone ?? '',
      location: unit.location ?? '',
      about: unit.about ?? '',
      skills: unit.skills.map((s) => ({
        name: s.name,
        category: s.category ?? '',
        level: s.level,
        order: s.order,
      })),
      links: unit.links,
      languages: unit.languages,
      experience_units: unit.experience_units.map((e) => ({
        title: e.title,
        organization: e.organization ?? '',
        location: e.location ?? '',
        description: e.description ?? '',
        from_date: e.from_date,
        to_date: e.to_date ?? '',
        order: e.order,
      })),
      education_units: unit.education_units.map((e) => ({
        institution: e.institution,
        degree: e.degree ?? '',
        field_of_study: e.field_of_study ?? '',
        location: e.location ?? '',
        from_date: e.from_date,
        to_date: e.to_date ?? '',
        description: e.description ?? '',
        order: e.order,
      })),
      portfolio_items: unit.portfolio_items.map((p) => ({
        title: p.title,
        category: p.category ?? '',
        description: p.description ?? '',
        date: p.date ?? '',
        order: p.order,
        links: p.links,
      })),
      certifications: unit.certifications.map((c) => ({
        name: c.name,
        issuing_organization: c.issuing_organization,
        issue_date: c.issue_date ?? '',
        expiry_date: c.expiry_date ?? '',
        credential_id: c.credential_id ?? '',
        credential_url: c.credential_url ?? '',
        order: c.order,
      })),
      awards: unit.awards.map((a) => ({
        title: a.title,
        issuer: a.issuer ?? '',
        date: a.date ?? '',
        description: a.description ?? '',
        order: a.order,
      })),
      template: unit.template ?? 'classic',
      custom_sections: unit.custom_sections.map((cs) => ({
        title: cs.title,
        order: cs.order,
        items: cs.items.map((i) => ({
          title: i.title,
          subtitle: i.subtitle ?? '',
          from_date: i.from_date ?? '',
          to_date: i.to_date ?? '',
          description: i.description ?? '',
          url: i.url ?? '',
          order: i.order,
        })),
      })),
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    const payload: PWBUnitUpdatePayload = {
      template: data.template,
      first_name: data.first_name,
      last_name: data.last_name,
      headline: data.headline,
      email: data.email,
      phone: nullify(data.phone as string),
      location: nullify(data.location as string),
      about: nullify(data.about as string),
      skills: (data.skills ?? []).map((s, i) => ({
        name: s.name,
        category: nullify(s.category as string),
        level: s.level || null,
        order: i,
      })),
      links: data.links ?? [],
      languages: data.languages ?? [],
      experience_units: (data.experience_units ?? []).map((e, i) => ({
        title: e.title,
        organization: nullify(e.organization as string),
        location: nullify(e.location as string),
        description: nullify(e.description as string),
        from_date: e.from_date,
        to_date: nullify(e.to_date as string),
        order: i,
      })),
      education_units: (data.education_units ?? []).map((e, i) => ({
        institution: e.institution,
        degree: nullify(e.degree as string),
        field_of_study: nullify(e.field_of_study as string),
        location: nullify(e.location as string),
        from_date: e.from_date,
        to_date: nullify(e.to_date as string),
        description: nullify(e.description as string),
        order: i,
      })),
      portfolio_items: (data.portfolio_items ?? []).map((p, i) => ({
        title: p.title,
        category: nullify(p.category as string),
        description: nullify(p.description as string),
        date: nullify(p.date as string),
        order: i,
        links: p.links ?? [],
      })),
      certifications: (data.certifications ?? []).map((c, i) => ({
        name: c.name,
        issuing_organization: c.issuing_organization,
        issue_date: nullify(c.issue_date as string),
        expiry_date: nullify(c.expiry_date as string),
        credential_id: nullify(c.credential_id as string),
        credential_url: nullify(c.credential_url as string),
        order: i,
      })),
      awards: (data.awards ?? []).map((a, i) => ({
        title: a.title,
        issuer: nullify(a.issuer as string),
        date: nullify(a.date as string),
        description: nullify(a.description as string),
        order: i,
      })),
      custom_sections: (data.custom_sections ?? []).map((cs, i) => ({
        title: cs.title,
        order: i,
        items: (cs.items ?? []).map((item, ii) => ({
          title: item.title,
          subtitle: nullify(item.subtitle as string),
          from_date: nullify(item.from_date as string),
          to_date: nullify(item.to_date as string),
          description: nullify(item.description as string),
          url: nullify(item.url as string),
          order: ii,
        })),
      })),
    };
    await onSave(payload);
  });

  return (
    <form onSubmit={handleSubmit}>
      {/* Sticky save bar */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-0 py-3 flex items-center justify-between mb-2 -mx-1 px-1 transition-theme">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {unit.first_name} {unit.last_name}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-500 font-mono">/{unit.unit_name}</p>
        </div>
        <Button type="submit" loading={saving} icon={<Save className="h-4 w-4" />}>
          Save changes
        </Button>
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      <div className="pt-6">
        {activeTab === 'basic' && <BasicInfoSection form={form} />}
        {activeTab === 'skills' && <SkillsSection form={form} />}
        {activeTab === 'experience' && <ExperienceSection form={form} />}
        {activeTab === 'education' && <EducationSection form={form} />}
        {activeTab === 'portfolio' && <PortfolioSection form={form} />}
        {activeTab === 'certifications' && <CertificationsSection form={form} />}
        {activeTab === 'awards' && <AwardsSection form={form} />}
        {activeTab === 'languages' && <LanguagesSection form={form} />}
        {activeTab === 'links' && <LinksSection form={form} />}
        {activeTab === 'custom' && <CustomSectionsSection form={form} />}
        {activeTab === 'media' && (
          <PhotosSection unitName={unit.unit_name} pdfResume={unit.pdf_resume} />
        )}
        {activeTab === 'template' && <TemplateSection form={form} />}
      </div>
    </form>
  );
}
