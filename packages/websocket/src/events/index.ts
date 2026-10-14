import type { ApiRecordFields, ApiRecordType } from '@irene/api/normalization';

/*
  The socket's contract, as `mycroft/core/notify.py` emits it. Nothing else
  arrives, so a name or shape here is a fact about the server, not a choice.
*/

/**
 * ============================================================
 * WEBSOCKET EVENTS
 * ============================================================
 */

/** The events the socket carries. */
export const WEBSOCKET_EVENTS = {
  /** A record, serialized in full. */
  modelCreated: 'model_created',
  modelUpdated: 'model_updated',

  /** A record named by id and type rather than sent. */
  object: 'object',
  newObject: 'newobject',

  message: 'message',
  counter: 'counter',
  notification: 'notification',

  /** The round trip the status page measures the connection with. */
  healthCheck: 'websocket_health_check',
} as const;

/**
 * ============================================================
 * PAYLOAD VALUES
 * ============================================================
 */

/** What a counter names: the model's own class name on the server. */
const WEBSOCKET_COUNTERS = [
  'File',
  'Project',
  'ProjectCollaborator',
  'ProjectNonCollaborator',
  'ProjectTeam',
  'ProjectNonTeam',
  'Submission',
  'Invitation',
  'OrganizationMember',
  'OrganizationTeam',
  'TeamProject',
  'TeamMember',
  'OrganizationNonTeamProject',
  'OrganizationNonTeamMember',
  'OrganizationArchive',
  'CapturedApi',
  'RegistrationRequest',
  'Report',
  'LegacyCVSSReport',
  'SbomReport',
  'PrivacyReport',
  'InterimReport',
] as const;

/** A model whose count changed. */
export type WebsocketCounter = (typeof WEBSOCKET_COUNTERS)[number];

/** The levels a message asks to be shown at, as `ak_vendor.NotifyEnum` numbers them. */
export const WEBSOCKET_NOTIFY_TYPE = {
  info: 0,
  success: 2,
  warning: 3,
  alert: 4,
  error: 5,
} as const;

/** The level a message asks to be shown at. */
export type WebsocketNotifyType =
  (typeof WEBSOCKET_NOTIFY_TYPE)[keyof typeof WEBSOCKET_NOTIFY_TYPE];

/** The products that count their notifications separately, as `AppknoxProductEnum` numbers them. */
export const WEBSOCKET_PRODUCTS = { appknox: 0, storeknox: 1 } as const;

/** The product a notification count belongs to. */
export type WebsocketProduct = (typeof WEBSOCKET_PRODUCTS)[keyof typeof WEBSOCKET_PRODUCTS];

/**
 * ============================================================
 * PAYLOADS SHAPE
 * ============================================================
 */

/** `model_created` and `model_updated`: a record in full, under the kind it is. */
export interface WebsocketRecordPayload {
  model_name: ApiRecordType;
  data: ApiRecordFields;
}

/** `object` and `newobject`: a record named rather than sent, by its JSON:API type. */
export interface WebsocketObjectPayload {
  id: string | number;
  type: string;
}

/** `message`: a line of text for the account. */
export interface WebsocketMessagePayload {
  message: string;
  notifyType: WebsocketNotifyType;
}

/** `counter`: the model whose count changed, named by its class. */
export interface WebsocketCounterPayload {
  type: WebsocketCounter;
}

/** `notification`: how many notifications are unread for one product. */
export interface WebsocketNotificationPayload {
  unread_count: number;
  product: WebsocketProduct;
}

/** `websocket_health_check`: whether the server considers the connection healthy. */
export interface WebsocketHealthPayload {
  is_healthy: boolean;
}

/**
 * ============================================================
 * GUARDS
 * ============================================================
 */

/**
 * Whether a payload carries every key the handler reads.
 *
 * A server of a different version sends what it sends, so a payload that falls
 * short is dropped rather than reaching the cache.
 *
 * @param payload - What arrived with the event.
 * @param keys - The keys the handler needs.
 * @returns Whether the payload carries all of them.
 */
export function hasWebsocketKeys<TPayload extends object>(
  payload: unknown,
  keys: (keyof TPayload)[]
): payload is TPayload {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  return keys.every((key) => (payload as TPayload)[key] !== undefined);
}

/**
 * Whether a name is one of the counts the server keeps.
 *
 * @param value - The name to check.
 * @returns Whether it names a count.
 */
export function isWebsocketCounter(value: unknown): value is WebsocketCounter {
  return WEBSOCKET_COUNTERS.includes(value as WebsocketCounter);
}
