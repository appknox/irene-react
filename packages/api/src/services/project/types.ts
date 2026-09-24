/** The platforms a project can be built for: Android, iOS, Windows. */
export type ApiProjectPlatform = 0 | 1 | 2;

/** A project as v3/projects returns it. Field names are the API's. */
export interface ApiProject {
  id: number;
  uuid: string;
  organization: number;
  package_name: string;
  platform: ApiProjectPlatform;
  file_count: number;
  active_profile_id: number | null;
  is_api_scan_enabled: boolean;
  is_manual_scan_available: boolean;
  show_unknown_analysis: boolean;
  created_on: string;
  updated_on: string;
  last_file_created_on: string | null;
}

/** What the list endpoint accepts. `q` filters by package name. */
export interface ApiProjectListRequest {
  limit: number;
  offset: number;
  q?: string;
}
