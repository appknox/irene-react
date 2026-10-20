/**
 * What the organization's scanning adds up to.
 *
 * The first three count files across the organization's active projects; the
 * last four count the files each kind of scan has finished with, so they do not
 * sum to the total.
 */
export interface ApiScanCount {
  id: number;
  total_scan_count: number;
  total_ios_scan_count: number;
  total_android_scan_count: number;
  static_scan_count: number;
  dynamic_scan_count: number;
  api_scan_count: number;
  manual_scan_count: number;
}

/**
 * One app's scans on one day.
 *
 * `file_count` and `platform` arrive as strings: the server counts and reads
 * the platform enum through serializers that render both as text.
 */
export interface ApiAppScan {
  created_on_date: string;
  file_count: string;
  package_name: string;
  platform: string;
}

/** What the app scan endpoint narrows by, as ISO timestamps. */
export interface ApiAppScanRequest {
  start_date: string;
  end_date: string;
}

/** How often one vulnerability was found, which names the vulnerability by id. */
export interface ApiRecentIssue {
  id: number;
  vulnerability: number;
  count: number;
}
