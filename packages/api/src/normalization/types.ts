import type { ApiSubmission } from '@irene/api/services/submission';

/*
  What a record is, and which records the server can send on its own.

  A type listed here can arrive outside a request, so the cache has to be able
  to hold it. A type with a shape listed here is also handed to callers typed.
*/

/** A value a record can hold. */
type ApiRecordFieldValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date
  | ApiRecordFields
  | string[]
  | number[]
  | boolean[]
  | ApiRecordFields[];

/** The fields of a record, as the server serialized them. */
export interface ApiRecordFields {
  [field: string]: ApiRecordFieldValue;
}

/** A record with an id, which is what the cache can hold. */
export type ApiRecordWithId = ApiRecordFields & { id: string | number };

/** The record types the server can send on its own, outside a request. */
export const API_RECORD_TYPES = [
  'file',
  'file-risk',
  'file-exploitability',
  'analysis',
  'submission',
  'dynamicscan',
  'offsec-scan',
  'knoxiq-scan',
  'sbom-component-export',
  'store-release-readiness-scan',
] as const;

/** A record's type. */
export type ApiRecordType = (typeof API_RECORD_TYPES)[number];

/**
 * The shape of each record type, which is how a caller knows what it was given.
 *
 * An app adds an entry for a type it needs typed. A type with no entry here is
 * read as the plain fields it arrived with.
 */
export interface ApiRecordShapes {
  submission: ApiSubmission;
}

/** The shape a record of this type has. */
export type ApiRecordOf<TType extends ApiRecordType> = TType extends keyof ApiRecordShapes
  ? ApiRecordShapes[TType]
  : ApiRecordFields;

/**
 * Whether a value is a record type this client knows.
 *
 * @param value - The value to check.
 * @returns Whether it names a record type.
 */
export function isApiRecordType(value: unknown): value is ApiRecordType {
  return API_RECORD_TYPES.includes(value as ApiRecordType);
}
