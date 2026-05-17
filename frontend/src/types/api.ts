// ─── Auth ────────────────────────────────────────────────────────────────────

export interface TokenPair {
  access: string;
  refresh: string;
}

export interface AccessToken {
  access: string;
}

// ─── User ────────────────────────────────────────────────────────────────────

export type UserPlan = 'free' | 'pro' | 'pro_plus' | 'owner';

export const PLAN_LIMITS: Record<UserPlan, number | null> = {
  free: 1,
  pro: 3,
  pro_plus: 10,
  owner: null,
};

export const PLAN_LABELS: Record<UserPlan, string> = {
  free: 'Free',
  pro: 'Pro',
  pro_plus: 'Pro+',
  owner: 'Owner',
};

export const PLAN_BADGE_COLORS: Record<UserPlan, string> = {
  free:     'bg-slate-700/40 text-slate-300 border-slate-600/30',
  pro:      'bg-blue-500/20 text-blue-300 border-blue-500/30',
  pro_plus: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  owner:    'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

export interface UserProfile {
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  last_login: string | null;
  date_joined: string;
  profile_picture: string | null;
  plan: UserPlan;
}

export interface ApiCredential {
  key: string;
  created_at: string;
  is_active: boolean;
}

export interface ApiCredentialWithSecret extends Omit<ApiCredential, 'is_active'> {
  secret: string;
}

// ─── Nested write schemas ────────────────────────────────────────────────────

export interface SkillWrite {
  name: string;
  category: string | null;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | null;
  order: number;
}

export interface LinkWrite {
  name: string;
  url: string;
}

export interface LanguageWrite {
  name: string;
  level:
    | 'A1 Begginer'
    | 'A2 Elementary'
    | 'B1 Intermediate'
    | 'B2 Upper-Intermediate'
    | 'C1 Advanced'
    | 'C2 Advanced Proficy'
    | 'Native'
    | 'Bilingual';
}

export interface ExperienceUnitWrite {
  title: string;
  organization: string | null;
  location: string | null;
  description: string | null;
  from_date: string;
  to_date: string | null;
  order: number;
}

export interface EducationUnitWrite {
  institution: string;
  degree: string | null;
  field_of_study: string | null;
  location: string | null;
  from_date: string;
  to_date: string | null;
  description: string | null;
  order: number;
}

export interface PortfolioItemWrite {
  id?: number;
  title: string;
  category: string | null;
  description: string | null;
  date: string | null;
  order: number;
  links: LinkWrite[];
}

export interface CertificationWrite {
  id?: number;
  name: string;
  issuing_organization: string;
  issue_date: string | null;
  expiry_date: string | null;
  credential_id: string | null;
  credential_url: string | null;
  order: number;
}

export interface AwardWrite {
  title: string;
  issuer: string | null;
  date: string | null;
  description: string | null;
  order: number;
}

export interface CustomSectionItemWrite {
  title: string;
  subtitle: string | null;
  from_date: string | null;
  to_date: string | null;
  description: string | null;
  url: string | null;
  order: number;
}

export interface CustomSectionWrite {
  title: string;
  order: number;
  items: CustomSectionItemWrite[];
}

// ─── PWBUnit full read ───────────────────────────────────────────────────────

export interface Photo {
  id: number;
  image: string;
  is_main: boolean;
}

export interface Skill extends SkillWrite {
  // same shape
}

export interface ExperienceUnit extends ExperienceUnitWrite {
  id: number;
}

export interface EducationUnit extends EducationUnitWrite {
  id: number;
  image: string | null;
}

export interface PortfolioItem extends PortfolioItemWrite {
  id: number;
  image: string | null;
}

export interface Certification extends CertificationWrite {
  id: number;
  image: string | null;
}

export interface Award extends AwardWrite {
  // same shape
}

export interface CustomSectionItem extends CustomSectionItemWrite {
  // same shape
}

export interface CustomSection {
  title: string;
  order: number;
  items: CustomSectionItem[];
}

export interface Language extends LanguageWrite {
  // same shape
}

export interface Link extends LinkWrite {
  // same shape
}

export interface PWBUnit {
  unit_name: string;
  first_name: string;
  last_name: string;
  headline: string;
  email: string;
  phone: string | null;
  location: string | null;
  about: string | null;
  template: 'classic' | 'modern' | 'minimal';
  pdf_resume: string | null;
  photos: Photo[];
  skills: Skill[];
  links: Link[];
  languages: Language[];
  experience_units: ExperienceUnit[];
  education_units: EducationUnit[];
  portfolio_items: PortfolioItem[];
  certifications: Certification[];
  awards: Award[];
  custom_sections: CustomSection[];
}

export interface PWBUnitListItem {
  unit_name: string;
  first_name: string;
  last_name: string;
  headline: string;
  email: string;
  phone: string | null;
  location: string | null;
}

export interface PWBUnitCreatePayload {
  unit_name: string;
  first_name: string;
  last_name: string;
  headline: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  about?: string | null;
  template?: 'classic' | 'modern' | 'minimal';
  skills?: SkillWrite[];
  links?: LinkWrite[];
  languages?: LanguageWrite[];
  experience_units?: ExperienceUnitWrite[];
  education_units?: EducationUnitWrite[];
  portfolio_items?: PortfolioItemWrite[];
  certifications?: CertificationWrite[];
  awards?: AwardWrite[];
  custom_sections?: CustomSectionWrite[];
}

export type PWBUnitUpdatePayload = Omit<Partial<PWBUnitCreatePayload>, 'unit_name'>;

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ─── Teammates ───────────────────────────────────────────────────────────────

export interface ProjectRole {
  id: number;
  name: string;
}

export interface TeammateLink {
  id: number;
  name: string;
  link: string;
}

export interface TeammateListItem {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  photo: string | null;
  project_roles: ProjectRole[];
  links: TeammateLink[];
}

export interface Teammate extends TeammateListItem {
  date_of_birth: string | null;
  story: string | null;
}

// ─── API error ───────────────────────────────────────────────────────────────

export interface ApiError {
  detail?: string;
  [key: string]: string | string[] | Record<string, string[]> | undefined;
}
