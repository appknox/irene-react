import { z } from 'zod';

import { akMT } from '@irene/translations/intl';
import { createAkFormField } from '@irene/ui/ak-form/helpers';

/** What irene's `validateFormat({ type: 'url' })` accepts, which is any absolute http URL. */
const url = () =>
  z
    .string()
    .trim()
    .refine((value) => /^https?:\/\/\S+$/i.test(value), { message: akMT('enterValidURL') });

const required = () =>
  z
    .string()
    .trim()
    .min(1, { message: akMT('pleaseEnterAllDetails') });

/** The channel Slack sends to, which is all irene asks for. */
export const buildSlackSchema = () => z.object({ channelId: required() });

export type SlackFormSchema = z.infer<ReturnType<typeof buildSlackSchema>>;

export const SlackFormField = createAkFormField<SlackFormSchema>();

/** The ServiceNow instance, the account on it, and its password. */
export const buildServiceNowSchema = () =>
  z.object({
    instanceUrl: url(),
    username: required(),
    password: required(),
  });

export type ServiceNowFormSchema = z.infer<ReturnType<typeof buildServiceNowSchema>>;

export const ServiceNowFormField = createAkFormField<ServiceNowFormSchema>();

/** The Jira host, the account on it, and its API key or access token. */
export const buildJiraSchema = () =>
  z.object({
    host: url(),
    username: required(),
    password: required(),
  });

export type JiraFormSchema = z.infer<ReturnType<typeof buildJiraSchema>>;

export const JiraFormField = createAkFormField<JiraFormSchema>();

/** The Splunk instance and the two tokens it is reached with, which is step one. */
export const buildSplunkSchema = () =>
  z.object({
    instanceUrl: url(),
    hecToken: required(),
    apiToken: required(),
  });

export type SplunkFormSchema = z.infer<ReturnType<typeof buildSplunkSchema>>;

export const SplunkFormField = createAkFormField<SplunkFormSchema>();
