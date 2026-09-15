/** The envelope DRF returns for any list endpoint. */
export interface DrfPageResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** What a caller gets once the envelope is unwrapped. */
export interface ApiPage<T> {
  items: T[];
  count: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
