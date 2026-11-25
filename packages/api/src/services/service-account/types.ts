/** Who made the account: a person, or the system on their behalf. */
export const SERVICE_ACCOUNT_TYPE = { user: 1, system: 2 } as const;

/** One of those two. */
export type ApiServiceAccountType =
  (typeof SERVICE_ACCOUNT_TYPE)[keyof typeof SERVICE_ACCOUNT_TYPE];

/**
 * What one service account may do, as the endpoint names each scope.
 *
 * Every scope is sent on an update, so a caller changes one by sending the
 * rest as they stand.
 */
export interface ApiServiceAccountScopes {
  scope_public_api_user_read: boolean;
  scope_public_api_user_write: boolean;
  scope_public_api_project_read: boolean;
  scope_public_api_scan_result_va: boolean;
  scope_public_api_upload_app: boolean;
  scope_public_api_team_operations: boolean;
  scope_public_api_store_release_readiness: boolean;
  scope_auto_approve_new_name_spaces: boolean;
  scope_cli: boolean;
  cli_scope_auto_approve_new_name_spaces: boolean;
}

/** One service account, as the endpoint sends it. */
export interface ApiServiceAccount extends ApiServiceAccountScopes {
  id: number;
  name: string;
  description: string;
  access_key_id: string;

  /** Sent once, when the account is made or its key is reset, and never read back. */
  secret_access_key?: string;

  /** When it stops working, or nothing where it does not expire. */
  expiry: string | null;
  is_expired: boolean;
  is_active: boolean;

  /** Whether it reaches every project, rather than the ones named on it. */
  all_projects: boolean;
  service_account_type: ApiServiceAccountType;
  created_on: string;
  updated_on: string;
  created_by_user: number | null;
  updated_by_user: number | null;
}

/** One project an account reaches. */
export interface ApiServiceAccountProject {
  id: number;
  project: number;
  service_account: number;
  added_on: string;
}

/** Which accounts to read, and how many. */
export interface ServiceAccountPage {
  limit: number;
  offset: number;

  /** Leaves out the ones the system made, which irene hides unless they are asked for. */
  showSystemCreated: boolean;

  /** Narrows the list to the accounts the command line may use. */
  showCliEnabled: boolean;
}

/**
 * The whole account, as an update carries it.
 *
 * The endpoint takes the record entire rather than the fields that changed, so
 * a caller sends the account it read with its changes written over it. The
 * secret is left out: it is answered once and never sent back.
 */
export interface ServiceAccountUpdateRequest extends Omit<ApiServiceAccount, 'secret_access_key'> {
  /** Always left out of the body, which this states rather than leaves to a caller. */
  secret_access_key: undefined;
}

/** What is sent to make an account, or to change one. */
export interface ServiceAccountRequest extends Partial<ApiServiceAccountScopes> {
  name: string;
  description: string;
  expiry: string | null;
  all_projects: boolean;

  /** Who it is made by, which a new one states rather than leaves to the endpoint. */
  service_account_type?: ApiServiceAccountType;
}
