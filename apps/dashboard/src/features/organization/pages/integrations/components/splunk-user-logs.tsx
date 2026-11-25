import { Fragment } from 'react';

import {
  AkSelect,
  AkSelectContent,
  AkSelectItem,
  AkSelectTrigger,
  AkSelectValue,
} from '@irene/ui/ak-select';

import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkLabel } from '@irene/ui/ak-label';
import { AkToggle } from '@irene/ui/ak-toggle';
import { AkTypography } from '@irene/ui/ak-typography';

import { LOG_FREQUENCIES } from './splunk-targets';

interface SplunkUserLogsProps {
  sendUserLogs: boolean;
  onToggleSendUserLogs: (send: boolean) => void;
  indexes: string[];
  userLogsIndex: string;
  onUserLogsIndexChange: (index: string) => void;
  logFrequencyHours: number;
  onLogFrequencyChange: (hours: number) => void;

  /** Marks the section as part of the second step of a new connection. */
  showOptionalHeading: boolean;

  /** Whether the choices are being changed, or only read. */
  isEditing: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
}

/**
 * Whether an organization's user activity is sent to Splunk, and on what terms.
 *
 * The same section serves two places: the second step of a new connection,
 * where it is headed "optional" and saved with the rest, and the panel of a
 * connected instance, where it is read until the edit control is pressed and
 * then saved on its own.
 *
 * @param props.sendUserLogs - Whether user logs are sent at all.
 * @param props.onToggleSendUserLogs - Called with the new state of that switch.
 * @param props.indexes - The indexes the instance holds.
 * @param props.userLogsIndex - Which index the logs are written into.
 * @param props.onUserLogsIndexChange - Called with the chosen index.
 * @param props.logFrequencyHours - How often they are sent.
 * @param props.onLogFrequencyChange - Called with the chosen interval.
 * @param props.showOptionalHeading - Heads the section "optional", for a new connection's step two.
 * @param props.isEditing - Offers the choices as controls rather than as values.
 * @param props.onEdit - Called by the edit control, where the section is read-only.
 * @param props.onSave - Called by the save control, where the section is edited on its own.
 * @param props.isSaving - Marks the save control busy.
 */
export function SplunkUserLogs({
  sendUserLogs,
  onToggleSendUserLogs,
  indexes,
  userLogsIndex,
  onUserLogsIndexChange,
  logFrequencyHours,
  onLogFrequencyChange,
  showOptionalHeading,
  isEditing,
  onEdit,
  onSave,
  isSaving = false,
}: Readonly<SplunkUserLogsProps>) {
  /* The panel of a connected instance, as opposed to step two of a new connection. */
  const isOwnSection = !showOptionalHeading;

  return (
    <Fragment>
      {showOptionalHeading && (
        <div className="w-full border-b border-border bg-background-subtle px-3.5 py-1.75">
          <AkTypography variant="subtitle2">{akMT('optional')}</AkTypography>
        </div>
      )}

      <div
        className={showOptionalHeading ? 'flex flex-col gap-3.5 p-3.5' : 'flex flex-col gap-3.5'}
      >
        <div className="flex flex-col items-start gap-1.75">
          <AkToggle
            id="splunk-send-user-logs"
            checked={sendUserLogs}
            onCheckedChange={onToggleSendUserLogs}
            data-test-splunk-send-user-logs
          />

          <AkLabel htmlFor="splunk-send-user-logs" className="ml-1.75 font-medium">
            {akMT('splunk.sendUserLogs')}
          </AkLabel>

          <AkTypography variant="body2" color="textSecondary" className="ml-1.75">
            {akMT('splunk.sendUserLogsDesc')}
          </AkTypography>
        </div>

        {sendUserLogs && (
          <Fragment>
            {isOwnSection && <AkDivider />}

            <div
              className={
                isOwnSection
                  ? 'ml-1.75 flex w-full items-start justify-between'
                  : 'flex w-full items-start justify-start'
              }
            >
              <div className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <AkTypography variant="subtitle2" data-test-splunk-user-logs-index-title>
                    {akMT('splunk.userLogsIndex')}
                  </AkTypography>

                  {isEditing ? (
                    <AkSelect value={userLogsIndex} onValueChange={onUserLogsIndexChange}>
                      <AkSelectTrigger
                        className="w-80 bg-background"
                        aria-label={akMT('splunk.userLogsIndex')}
                        data-test-splunk-user-logs-index
                      >
                        <AkSelectValue />
                      </AkSelectTrigger>

                      <AkSelectContent>
                        {indexes.map((index) => (
                          <AkSelectItem key={index} value={index}>
                            {index}
                          </AkSelectItem>
                        ))}
                      </AkSelectContent>
                    </AkSelect>
                  ) : (
                    <AkTypography
                      variant="body2"
                      color="textSecondary"
                      data-test-splunk-user-logs-index-value
                    >
                      {userLogsIndex}
                    </AkTypography>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <AkTypography variant="subtitle2">{akMT('splunk.timeInterval')}</AkTypography>

                  {isEditing ? (
                    <AkSelect
                      value={String(logFrequencyHours)}
                      onValueChange={(hours) => onLogFrequencyChange(Number(hours))}
                    >
                      <AkSelectTrigger
                        className="w-80 bg-background"
                        aria-label={akMT('splunk.timeInterval')}
                        data-test-splunk-log-frequency
                      >
                        <AkSelectValue />
                      </AkSelectTrigger>

                      <AkSelectContent>
                        {LOG_FREQUENCIES.map((hours) => (
                          <AkSelectItem key={hours} value={String(hours)}>
                            {`${hours} ${akMT('hours')}`}
                          </AkSelectItem>
                        ))}
                      </AkSelectContent>
                    </AkSelect>
                  ) : (
                    <AkTypography
                      variant="body2"
                      color="textSecondary"
                      data-test-splunk-log-frequency-value
                    >
                      {`${logFrequencyHours} ${akMT('hours')}`}
                    </AkTypography>
                  )}
                </div>

                {isEditing && isOwnSection && (
                  <AkButton loading={isSaving} onClick={onSave} data-test-splunk-save-user-logs>
                    {akMT('save')}
                  </AkButton>
                )}
              </div>

              {isOwnSection && !isEditing && (
                <AkIconButton
                  variant="outlined"
                  onClick={onEdit}
                  aria-label={akMT('edit')}
                  title={akMT('edit')}
                  data-test-splunk-edit-user-logs
                >
                  <AkIcon name="material-symbols:edit" />
                </AkIconButton>
              )}
            </div>
          </Fragment>
        )}
      </div>
    </Fragment>
  );
}
