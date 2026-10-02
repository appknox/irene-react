import type { ComponentType, ReactNode } from 'react';
import type { z, ZodType } from 'zod';

import { NotificationErrorMessage } from './messages/error';
import { NfAmNewversn } from './messages/nf-am-newversn';
import { nfAmNewversnContextSchema } from './messages/nf-am-newversn/context';
import { NfApistcmpltd1 } from './messages/nf-apistcmpltd1';
import { nfApistcmpltd1ContextSchema } from './messages/nf-apistcmpltd1/context';
import { NfAutomatedDastCompleted } from './messages/nf-automated-dast-completed';
import { nfAutomatedDastCompletedContextSchema } from './messages/nf-automated-dast-completed/context';
import { NfAutomatedDastErrored } from './messages/nf-automated-dast-errored';
import { nfAutomatedDastErroredContextSchema } from './messages/nf-automated-dast-errored/context';
import { NfAutomatedDastInProgress } from './messages/nf-automated-dast-in-progress';
import { nfAutomatedDastInProgressContextSchema } from './messages/nf-automated-dast-in-progress/context';
import { NfAutomatedDastPartiallyCompleted } from './messages/nf-automated-dast-partially-completed';
import { nfAutomatedDastPartiallyCompletedContextSchema } from './messages/nf-automated-dast-partially-completed/context';
import { NfDastcmpltd1 } from './messages/nf-dastcmpltd1';
import { nfDastcmpltd1ContextSchema } from './messages/nf-dastcmpltd1/context';
import { NfJiraPushErr } from './messages/nf-jira-push-err';
import { nfJiraPushErrContextSchema } from './messages/nf-jira-push-err/context';
import { NfNsapprvd1 } from './messages/nf-nsapprvd1';
import { nfNsapprvd1ContextSchema } from './messages/nf-nsapprvd1/context';
import { NfNsapprvd2 } from './messages/nf-nsapprvd2';
import { nfNsapprvd2ContextSchema } from './messages/nf-nsapprvd2/context';
import { NfNsautoapprvd1 } from './messages/nf-nsautoapprvd1';
import { nfNsautoapprvd1ContextSchema } from './messages/nf-nsautoapprvd1/context';
import { NfNsautoapprvd2 } from './messages/nf-nsautoapprvd2';
import { nfNsautoapprvd2ContextSchema } from './messages/nf-nsautoapprvd2/context';
import { NfNsrejctd1 } from './messages/nf-nsrejctd1';
import { nfNsrejctd1ContextSchema } from './messages/nf-nsrejctd1/context';
import { NfNsrejctd2 } from './messages/nf-nsrejctd2';
import { nfNsrejctd2ContextSchema } from './messages/nf-nsrejctd2/context';
import { NfNsreqstd1 } from './messages/nf-nsreqstd1';
import { nfNsreqstd1ContextSchema } from './messages/nf-nsreqstd1/context';
import { NfNsreqstd2 } from './messages/nf-nsreqstd2';
import { nfNsreqstd2ContextSchema } from './messages/nf-nsreqstd2/context';
import { NfOvrreqApproved } from './messages/nf-ovrreq-approved';
import { NfOvrreqApprovedReqstr } from './messages/nf-ovrreq-approved-reqstr';
import { nfOvrreqApprovedReqstrContextSchema } from './messages/nf-ovrreq-approved-reqstr/context';
import { nfOvrreqApprovedContextSchema } from './messages/nf-ovrreq-approved/context';
import { NfOvrreqRaised } from './messages/nf-ovrreq-raised';
import { nfOvrreqRaisedContextSchema } from './messages/nf-ovrreq-raised/context';
import { NfOvrreqRejected } from './messages/nf-ovrreq-rejected';
import { nfOvrreqRejectedContextSchema } from './messages/nf-ovrreq-rejected/context';
import { NfPublicApiUserUpdated } from './messages/nf-public-api-user-updated';
import { nfPublicApiUserUpdatedContextSchema } from './messages/nf-public-api-user-updated/context';
import { NfSastcmpltd1 } from './messages/nf-sastcmpltd1';
import { nfSastcmpltd1ContextSchema } from './messages/nf-sastcmpltd1/context';
import { NfSbomCompUpdate } from './messages/nf-sbom-comp-update';
import { nfSbomCompUpdateContextSchema } from './messages/nf-sbom-comp-update/context';
import { NfSbomVulnUpdate } from './messages/nf-sbom-vuln-update';
import { nfSbomVulnUpdateContextSchema } from './messages/nf-sbom-vuln-update/context';
import { NfSbomcmpltd } from './messages/nf-sbomcmpltd';
import { nfSbomcmpltdContextSchema } from './messages/nf-sbomcmpltd/context';
import { NfSkNewversn } from './messages/nf-sk-newversn';
import { nfSkNewversnContextSchema } from './messages/nf-sk-newversn/context';
import { NfSkSubexp } from './messages/nf-sk-subexp';
import { nfSkSubexpContextSchema } from './messages/nf-sk-subexp/context';
import { NfStrUrlNsreqstd1 } from './messages/nf-str-url-nsreqstd1';
import { nfStrUrlNsreqstd1ContextSchema } from './messages/nf-str-url-nsreqstd1/context';
import { NfStrUrlNsreqstd2 } from './messages/nf-str-url-nsreqstd2';
import { nfStrUrlNsreqstd2ContextSchema } from './messages/nf-str-url-nsreqstd2/context';
import { NfStrUrlUpldfailnprjdeny1 } from './messages/nf-str-url-upldfailnprjdeny1';
import { nfStrUrlUpldfailnprjdeny1ContextSchema } from './messages/nf-str-url-upldfailnprjdeny1/context';
import { NfStrUrlUpldfailnprjdeny2 } from './messages/nf-str-url-upldfailnprjdeny2';
import { nfStrUrlUpldfailnprjdeny2ContextSchema } from './messages/nf-str-url-upldfailnprjdeny2/context';
import { NfStrUrlUpldfailnscreatd1 } from './messages/nf-str-url-upldfailnscreatd1';
import { nfStrUrlUpldfailnscreatd1ContextSchema } from './messages/nf-str-url-upldfailnscreatd1/context';
import { NfStrUrlUpldfailnsunaprv1 } from './messages/nf-str-url-upldfailnsunaprv1';
import { nfStrUrlUpldfailnsunaprv1ContextSchema } from './messages/nf-str-url-upldfailnsunaprv1/context';
import { NfStrUrlUpldfailpay2 } from './messages/nf-str-url-upldfailpay2';
import { nfStrUrlUpldfailpay2ContextSchema } from './messages/nf-str-url-upldfailpay2/context';
import { NfStrUrlUpldfailpayrq1 } from './messages/nf-str-url-upldfailpayrq1';
import { nfStrUrlUpldfailpayrq1ContextSchema } from './messages/nf-str-url-upldfailpayrq1/context';
import { NfStrUrlUploadSuccess } from './messages/nf-str-url-upload-success';
import { nfStrUrlUploadSuccessContextSchema } from './messages/nf-str-url-upload-success/context';
import { NfStrUrlVldtnErr } from './messages/nf-str-url-vldtn-err';
import { nfStrUrlVldtnErrContextSchema } from './messages/nf-str-url-vldtn-err/context';
import { NfSystmFileUploadSuccess } from './messages/nf-systm-file-upload-success';
import { nfSystmFileUploadSuccessContextSchema } from './messages/nf-systm-file-upload-success/context';
import { NfUpldfailnprjdeny1 } from './messages/nf-upldfailnprjdeny1';
import { nfUpldfailnprjdeny1ContextSchema } from './messages/nf-upldfailnprjdeny1/context';
import { NfUpldfailnprjdeny2 } from './messages/nf-upldfailnprjdeny2';
import { nfUpldfailnprjdeny2ContextSchema } from './messages/nf-upldfailnprjdeny2/context';
import { NfUpldfailnscreatd1 } from './messages/nf-upldfailnscreatd1';
import { nfUpldfailnscreatd1ContextSchema } from './messages/nf-upldfailnscreatd1/context';
import { NfUpldfailnsunaprv1 } from './messages/nf-upldfailnsunaprv1';
import { nfUpldfailnsunaprv1ContextSchema } from './messages/nf-upldfailnsunaprv1/context';
import { NfUpldfailpay2 } from './messages/nf-upldfailpay2';
import { nfUpldfailpay2ContextSchema } from './messages/nf-upldfailpay2/context';
import { NfUpldfailpayrq1 } from './messages/nf-upldfailpayrq1';
import { nfUpldfailpayrq1ContextSchema } from './messages/nf-upldfailpayrq1/context';

/** What the list calls to render one notification's own message. */
type MessageRenderer = (context: Record<string, unknown>, code: string) => ReactNode;

/**
 * Pairs a notification code with the component that renders it, checking the
 * context against the shape that component declares.
 *
 * A context the schema rejects renders the error message rather than a message
 * with holes in it, so a field the API renames surfaces as the code it came from
 * instead of as missing words.
 *
 * @param schema - The shape the notification's context takes.
 * @param Component - The component rendering this notification.
 * @returns A renderer taking the notification's raw context and its code.
 */
function validatedMessageRenderer<TSchema extends ZodType<Record<string, unknown>>>(
  schema: TSchema,
  Component: ComponentType<{ context: z.output<TSchema> }>
): MessageRenderer {
  return function renderMessage(context: Record<string, unknown>, code: string) {
    const parsed = schema.safeParse(context);

    if (!parsed.success) {
      return <NotificationErrorMessage messageCode={code} />;
    }

    return <Component context={parsed.data} />;
  };
}

/**
 * Every notification this build renders, keyed by the code the API sends.
 *
 * A code that is not here, and a context its message's schema rejects, both
 * render through the error message, which states the code rather than the
 * notification.
 */
export const NOTIFICATION_MAP = {
  NF_AM_NEWVERSN: validatedMessageRenderer(nfAmNewversnContextSchema, NfAmNewversn),
  NF_APISTCMPLTD1: validatedMessageRenderer(nfApistcmpltd1ContextSchema, NfApistcmpltd1),
  NF_AUTOMATED_DAST_COMPLETED: validatedMessageRenderer(
    nfAutomatedDastCompletedContextSchema,
    NfAutomatedDastCompleted
  ),
  NF_AUTOMATED_DAST_ERRORED: validatedMessageRenderer(
    nfAutomatedDastErroredContextSchema,
    NfAutomatedDastErrored
  ),
  NF_AUTOMATED_DAST_IN_PROGRESS: validatedMessageRenderer(
    nfAutomatedDastInProgressContextSchema,
    NfAutomatedDastInProgress
  ),
  NF_AUTOMATED_DAST_PARTIALLY_COMPLETED: validatedMessageRenderer(
    nfAutomatedDastPartiallyCompletedContextSchema,
    NfAutomatedDastPartiallyCompleted
  ),
  NF_DASTCMPLTD1: validatedMessageRenderer(nfDastcmpltd1ContextSchema, NfDastcmpltd1),
  NF_JIRA_PUSH_ERR: validatedMessageRenderer(nfJiraPushErrContextSchema, NfJiraPushErr),
  NF_NSAPPRVD1: validatedMessageRenderer(nfNsapprvd1ContextSchema, NfNsapprvd1),
  NF_NSAPPRVD2: validatedMessageRenderer(nfNsapprvd2ContextSchema, NfNsapprvd2),
  NF_NSAUTOAPPRVD1: validatedMessageRenderer(nfNsautoapprvd1ContextSchema, NfNsautoapprvd1),
  NF_NSAUTOAPPRVD2: validatedMessageRenderer(nfNsautoapprvd2ContextSchema, NfNsautoapprvd2),
  NF_NSREJCTD1: validatedMessageRenderer(nfNsrejctd1ContextSchema, NfNsrejctd1),
  NF_NSREJCTD2: validatedMessageRenderer(nfNsrejctd2ContextSchema, NfNsrejctd2),
  NF_NSREQSTD1: validatedMessageRenderer(nfNsreqstd1ContextSchema, NfNsreqstd1),
  NF_NSREQSTD2: validatedMessageRenderer(nfNsreqstd2ContextSchema, NfNsreqstd2),
  NF_OVRREQ_APPROVED: validatedMessageRenderer(nfOvrreqApprovedContextSchema, NfOvrreqApproved),
  NF_OVRREQ_APPROVED_REQSTR: validatedMessageRenderer(
    nfOvrreqApprovedReqstrContextSchema,
    NfOvrreqApprovedReqstr
  ),
  NF_OVRREQ_RAISED: validatedMessageRenderer(nfOvrreqRaisedContextSchema, NfOvrreqRaised),
  NF_OVRREQ_REJECTED: validatedMessageRenderer(nfOvrreqRejectedContextSchema, NfOvrreqRejected),
  NF_PUBLIC_API_USER_UPDATED: validatedMessageRenderer(
    nfPublicApiUserUpdatedContextSchema,
    NfPublicApiUserUpdated
  ),
  NF_SASTCMPLTD1: validatedMessageRenderer(nfSastcmpltd1ContextSchema, NfSastcmpltd1),
  NF_SBOM_COMP_UPDATE: validatedMessageRenderer(nfSbomCompUpdateContextSchema, NfSbomCompUpdate),
  NF_SBOM_VULN_UPDATE: validatedMessageRenderer(nfSbomVulnUpdateContextSchema, NfSbomVulnUpdate),
  NF_SBOMCMPLTD: validatedMessageRenderer(nfSbomcmpltdContextSchema, NfSbomcmpltd),
  NF_SK_NEWVERSN: validatedMessageRenderer(nfSkNewversnContextSchema, NfSkNewversn),
  NF_SK_SUBEXP: validatedMessageRenderer(nfSkSubexpContextSchema, NfSkSubexp),
  NF_STR_URL_NSREQSTD1: validatedMessageRenderer(nfStrUrlNsreqstd1ContextSchema, NfStrUrlNsreqstd1),
  NF_STR_URL_NSREQSTD2: validatedMessageRenderer(nfStrUrlNsreqstd2ContextSchema, NfStrUrlNsreqstd2),
  NF_STR_URL_UPLDFAILNPRJDENY1: validatedMessageRenderer(
    nfStrUrlUpldfailnprjdeny1ContextSchema,
    NfStrUrlUpldfailnprjdeny1
  ),
  NF_STR_URL_UPLDFAILNPRJDENY2: validatedMessageRenderer(
    nfStrUrlUpldfailnprjdeny2ContextSchema,
    NfStrUrlUpldfailnprjdeny2
  ),
  NF_STR_URL_UPLDFAILNSCREATD1: validatedMessageRenderer(
    nfStrUrlUpldfailnscreatd1ContextSchema,
    NfStrUrlUpldfailnscreatd1
  ),
  NF_STR_URL_UPLDFAILNSUNAPRV1: validatedMessageRenderer(
    nfStrUrlUpldfailnsunaprv1ContextSchema,
    NfStrUrlUpldfailnsunaprv1
  ),
  NF_STR_URL_UPLDFAILPAY2: validatedMessageRenderer(
    nfStrUrlUpldfailpay2ContextSchema,
    NfStrUrlUpldfailpay2
  ),
  NF_STR_URL_UPLDFAILPAYRQ1: validatedMessageRenderer(
    nfStrUrlUpldfailpayrq1ContextSchema,
    NfStrUrlUpldfailpayrq1
  ),
  NF_STR_URL_UPLOAD_SUCCESS: validatedMessageRenderer(
    nfStrUrlUploadSuccessContextSchema,
    NfStrUrlUploadSuccess
  ),
  NF_STR_URL_VLDTN_ERR: validatedMessageRenderer(nfStrUrlVldtnErrContextSchema, NfStrUrlVldtnErr),
  NF_SYSTM_FILE_UPLOAD_SUCCESS: validatedMessageRenderer(
    nfSystmFileUploadSuccessContextSchema,
    NfSystmFileUploadSuccess
  ),
  NF_UPLDFAILNPRJDENY1: validatedMessageRenderer(
    nfUpldfailnprjdeny1ContextSchema,
    NfUpldfailnprjdeny1
  ),
  NF_UPLDFAILNPRJDENY2: validatedMessageRenderer(
    nfUpldfailnprjdeny2ContextSchema,
    NfUpldfailnprjdeny2
  ),
  NF_UPLDFAILNSCREATD1: validatedMessageRenderer(
    nfUpldfailnscreatd1ContextSchema,
    NfUpldfailnscreatd1
  ),
  NF_UPLDFAILNSUNAPRV1: validatedMessageRenderer(
    nfUpldfailnsunaprv1ContextSchema,
    NfUpldfailnsunaprv1
  ),
  NF_UPLDFAILPAY2: validatedMessageRenderer(nfUpldfailpay2ContextSchema, NfUpldfailpay2),
  NF_UPLDFAILPAYRQ1: validatedMessageRenderer(nfUpldfailpayrq1ContextSchema, NfUpldfailpayrq1),
} satisfies Record<string, MessageRenderer>;

/** A notification code this build knows how to render. */
export type NotificationCode = keyof typeof NOTIFICATION_MAP;
