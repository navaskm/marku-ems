import type { Company, CompanySettings, Department } from "@/types";

export const MARKU_ID = "company-marku";

export const companies: Company[] = [
  {
    id: MARKU_ID,
    name: "MarkU — The Life Design Academy",
    code: "MARKU",
    industry: "Education",
    headquarters: "India",
    timezone: "Asia/Calcutta",
    workStart: "09:00",
    lateAfter: "09:15",
    workEnd: "18:00",
    logoInitials: "MU",
  },
];

export const companySettings: CompanySettings[] = [
  { companyId: MARKU_ID, allowSelfCheckIn: true, requireLeaveReason: true, notifyManagersOnLeave: true },
];

export const departments: Department[] = [
  { id: "marku-management", companyId: MARKU_ID, name: "Management", description: "Leadership and company direction" },
  { id: "marku-hr", companyId: MARKU_ID, name: "Human Resources", description: "People operations and employee experience" },
  { id: "marku-sales", companyId: MARKU_ID, name: "Sales", description: "Admissions, partnerships, and learner growth" },
  { id: "marku-digital-marketing", companyId: MARKU_ID, name: "Digital Marketing", description: "Digital campaigns, content, and brand growth" },
  { id: "marku-development", companyId: MARKU_ID, name: "Development", description: "Technology, products, and platform development" },
];
