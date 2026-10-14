/** What a partner organization is allowed to do. */
export interface ApiPartnerAccess {
  view_plans: boolean;
  transfer_credits: boolean;
  list_projects: boolean;
  list_files: boolean;
  view_analytics: boolean;
  view_reports: boolean;
  admin_registration: boolean;
}

/** A partner organization, and what it may do. */
export interface ApiPartner {
  id: number;
  access: ApiPartnerAccess;
}
