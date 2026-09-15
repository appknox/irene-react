/** A project as v3/projects returns it. Field names are the API's. */
export interface Project {
  id: number;
  package_name: string;
  url: string;
  platform: number;
  file_count: number;
  active_profile_id: number;
  is_manual_scan_available: boolean;
  show_unknown_analysis: boolean;
  last_file_created_on: string;
}

/** What the list endpoint accepts. `q` filters by package name. */
export interface ProjectListParams {
  limit: number;
  offset: number;
  q?: string;
}
