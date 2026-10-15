/**
 * A plan the organization can subscribe to, priced for each billing period.
 * A period the plan has no variant for falls back to the monthly plan's URL
 * and price. `description` is a comma-separated list of what it includes.
 */
export interface ApiPlan {
  id: string;
  plan_id: string;
  name: string;
  description: string;
  monthly_url: string;
  quarterly_url: string;
  half_yearly_url: string;
  yearly_url: string;
  monthly_price: number;
  quarterly_price: number;
  half_yearly_price: number;
  yearly_price: number;
}

/** The organization's subscription to a plan. */
export interface ApiSubscription {
  id: string;
  plan_name: string;
  billing_period: string;
  billing_period_unit: string;
  plan_quantity: string;
  expiry_date: string;
  status: string;
  is_active: boolean;
  is_trial: boolean;
  is_cancelled: boolean;
  is_per_scan: boolean;
}

/**
 * One invoice. `download_url` is an API path that answers with a short-lived
 * link to the PDF, rather than the PDF itself.
 */
export interface ApiInvoice {
  id: string;
  invoice_id: string;
  amount: string;
  paid_on: string | null;
  /** When payment falls due; past it, an unpaid invoice is overdue. */
  due_date: string | null;
  is_paid: boolean;
  plan_name: string;
  download_url: string;
}

/** The link an invoice's `download_url` answers with. */
export interface ApiInvoiceDownload {
  url: string;
}

/**
 * The enterprise license a self-hosted deployment runs under. It is licensed
 * either per app or per scan; `is_limited_scans` says which, and the other
 * half of the fields is zeroed.
 */
export interface ApiLicense {
  id: number;
  key: string;
  start_date: string;
  expiry_date: string;
  status: string;
  name: string;
  email: string;
  is_limited_scans: boolean;
  per_app_name: string;
  per_app_description: string;
  per_app_quantity: number;
  per_scan_name: string;
  per_scan_description: string;
  per_scan_quantity: number;
}

/**
 * The subscription term and license counts shown to an owner whose
 * organization has the subscription page turned on. Licenses count projects:
 * `licenses_remaining` is the procured number less the active projects, never
 * below zero. Any field the subscription does not set arrives empty.
 */
export interface ApiSubscriptionInfo {
  id: number;
  start_date: string | null;
  expiry_date: string | null;
  original_licenses: number | null;
  licenses_remaining: number | null;
}
