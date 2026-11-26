import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import {
  OrganizationService,
  type ApiOrganizationSigningCertificate,
} from '@irene/api/services/organization';

import { getApiErrorMessage } from '@irene/api/utils/errors';
import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkDrawer, AkDrawerBody, AkDrawerContent, AkDrawerHeader } from '@irene/ui/ak-drawer';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkTabs, AkTabsList, AkTabsTrigger } from '@irene/ui/ak-tabs';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';
import ProjectListEmpty from '@irene/ui/svgs/project-list-empty.svg?react';

import { useOrganization } from '@/hooks/use-organization';
import { organizationKeys, organizationSigningCertificatesOptions } from '@/queries/organization';

import { CertCard } from './cert-card';
import { CertUploadForm } from './cert-upload-form';
import { SettingsPanel } from './settings-panel';

/** Which half of the drawer is open: adding one, or reading the ones already held. */
type CertTab = 'add' | 'existing';

/** Nothing held yet, which irene draws in place of the list. */
function NoCertificates() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-1.75 px-4.25 py-7"
      data-test-org-signing-cert-empty
    >
      <ProjectListEmpty aria-hidden="true" width="155" height="63" />

      <AkTypography tag="h5" fontWeight="medium" data-test-org-signing-cert-empty-title>
        {akMT('cyod.signingCert.noneTitle')}
      </AkTypography>

      <AkTypography variant="body2" className="max-w-87.5 text-center">
        {akMT('cyod.signingCert.none')}
      </AkTypography>
    </div>
  );
}

interface DeleteConfirmProps {
  certificate: ApiOrganizationSigningCertificate;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** The question asked before a certificate is removed, which cannot be undone. */
function DeleteConfirm({
  certificate,
  isDeleting,
  onConfirm,
  onCancel,
}: Readonly<DeleteConfirmProps>) {
  return (
    <div className="flex flex-col" data-test-org-signing-cert-delete-confirm>
      <AkTypography
        variant="h5"
        fontWeight="medium"
        className="p-3.5"
        data-test-org-signing-cert-delete-question
      >
        <AkMessageTranslate
          id="cyod.signingCert.deleteQuestion"
          values={{ name: certificate.name ?? akMT('cyod.signingCert.unnamed') }}
        />
      </AkTypography>

      <AkDivider color="dark" />

      <AkTypography variant="body2" className="p-3.5" data-test-org-signing-cert-delete-reason>
        {akMT('cyod.signingCert.deleteReason')}
      </AkTypography>

      <AkDivider color="dark" />

      <div className="flex items-center gap-2.75 p-3.5">
        <AkButton
          type="button"
          loading={isDeleting}
          onClick={onConfirm}
          data-test-org-signing-cert-delete-confirm-yes
        >
          {akMT('delete')}
        </AkButton>

        <AkButton
          type="button"
          variant="outlined"
          color="neutral"
          disabled={isDeleting}
          onClick={onCancel}
          data-test-org-signing-cert-delete-confirm-no
        >
          {akMT('cyod.signingCert.deleteNo')}
        </AkButton>
      </div>
    </div>
  );
}

/**
 * The iOS signing certificate apps are re-signed with for scans on own devices.
 *
 * The panel itself is a heading and a control; everything else happens in a
 * drawer, which opens either on the form or on the certificates already held.
 * Only one may be active, and the active one may not be removed while others
 * remain — the endpoint refuses that, so the control is held back instead.
 */
export function SigningCertificatePanel() {
  const queryClient = useQueryClient();
  const { selected } = useOrganization();

  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<CertTab>('add');

  const [pendingDelete, setPendingDelete] = useState<ApiOrganizationSigningCertificate | null>(
    null
  );

  const [activatingId, setActivatingId] = useState<number | null>(null);

  const certificates = useQuery(organizationSigningCertificatesOptions(selected?.id));

  const refreshCertificates = () =>
    queryClient.invalidateQueries({
      queryKey: organizationKeys.signingCertificates(selected?.id),
    });

  const activate = useMutation({
    mutationFn: (certificate: ApiOrganizationSigningCertificate) => {
      setActivatingId(certificate.id);

      return OrganizationService.activateOrganizationSigningCertificate(
        Number(selected?.id),
        certificate.id
      );
    },

    onSuccess: async () => {
      akNotify.success(akMT('cyod.signingCert.activated'));

      await refreshCertificates();
    },

    onError: (error) => {
      akNotify.error(getApiErrorMessage(error) ?? akMT('pleaseTryAgain'));
    },

    onSettled: () => {
      setActivatingId(null);
    },
  });

  const remove = useMutation({
    mutationFn: (certificate: ApiOrganizationSigningCertificate) =>
      OrganizationService.deleteOrganizationSigningCertificate(
        Number(selected?.id),
        certificate.id
      ),

    onSuccess: async () => {
      akNotify.success(akMT('cyod.signingCert.deleted'));
      setPendingDelete(null);

      await refreshCertificates();
    },

    onError: (error) => {
      akNotify.error(getApiErrorMessage(error) ?? akMT('pleaseTryAgain'));
    },
  });

  const openOn = (which: CertTab) => {
    setTab(which);
    setPendingDelete(null);
    setIsOpen(true);
  };

  const rows = certificates.data?.items ?? [];

  return (
    <SettingsPanel
      title={akMT('cyod.signingCert.title')}
      testAttribute="org-signing-cert"
      titleAction={
        <AkButton type="button" onClick={() => openOn('add')} data-test-org-signing-cert-open>
          {akMT('cyod.signingCert.add')}
        </AkButton>
      }
    >
      <AkTypography variant="body2" color="textSecondary" data-test-org-signing-cert-description>
        {`${akMT('cyod.signingCert.desc')} ${akMT('cyod.signingCert.existingCertHint')} `}

        <AkButton
          type="button"
          variant="text"
          onClick={() => openOn('existing')}
          data-test-org-signing-cert-existing-link
        >
          {akMT('cyod.signingCert.existingTab')}
        </AkButton>

        {` ${akMT('cyod.signingCert.existingCertHintSuffix')}`}
      </AkTypography>

      <AkDrawer open={isOpen} onOpenChange={setIsOpen}>
        <AkDrawerContent
          aria-describedby={undefined}
          className="w-195 max-w-full"
          data-test-org-signing-cert-drawer
        >
          <AkDrawerHeader
            title={pendingDelete === null ? akMT('cyod.signingCert.add') : akMT('confirmation')}
            closeLabel={akMT('close')}
          >
            {/* Only while a question is being asked, which it steps back from. */}
            {pendingDelete !== null && (
              <AkIconButton
                type="button"
                size="small"
                aria-label={akMT('back')}
                className="text-inherit"
                onClick={() => setPendingDelete(null)}
                data-test-org-signing-cert-back
              >
                <AkIcon name="material-symbols:arrow-back" />
              </AkIconButton>
            )}
          </AkDrawerHeader>

          <AkDrawerBody noGutter>
            {pendingDelete !== null && (
              <DeleteConfirm
                certificate={pendingDelete}
                isDeleting={remove.isPending}
                onConfirm={() => remove.mutate(pendingDelete)}
                onCancel={() => setPendingDelete(null)}
              />
            )}

            {pendingDelete === null && (
              <div className="flex w-full flex-col">
                <div className="px-4.25 pt-3.5">
                  <AkTabs value={tab} onValueChange={(value) => setTab(value as CertTab)}>
                    <AkTabsList>
                      <AkTabsTrigger value="add" data-test-org-signing-cert-add-tab>
                        {akMT('cyod.signingCert.add')}
                      </AkTabsTrigger>

                      <AkTabsTrigger value="existing" data-test-org-signing-cert-existing-tab>
                        {akMT('cyod.signingCert.existingTab')}
                      </AkTabsTrigger>
                    </AkTabsList>
                  </AkTabs>
                </div>

                {tab === 'add' && (
                  <CertUploadForm
                    onUploaded={() => setTab('existing')}
                    onCancel={() => setIsOpen(false)}
                  />
                )}

                {tab === 'existing' && (
                  <div
                    className="flex flex-col gap-3.5 px-4.25 py-3.5"
                    data-test-org-signing-cert-list
                  >
                    {certificates.isPending &&
                      [1, 2].map((card) => <AkSkeleton key={card} height="6rem" />)}

                    {!certificates.isPending && rows.length === 0 && <NoCertificates />}

                    {!certificates.isPending && rows.length > 0 && (
                      <AkTypography
                        variant="body2"
                        fontWeight="bold"
                        data-test-org-signing-cert-list-heading
                      >
                        {akMT('cyod.signingCert.organizationCertificatesHeading')}
                      </AkTypography>
                    )}

                    {!certificates.isPending &&
                      rows.map((certificate) => (
                        <CertCard
                          key={certificate.id}
                          certificate={certificate}
                          isActivating={activatingId === certificate.id && activate.isPending}
                          hasSiblings={rows.length > 1}
                          onActivate={(chosen) => activate.mutate(chosen)}
                          onDelete={setPendingDelete}
                        />
                      ))}
                  </div>
                )}
              </div>
            )}
          </AkDrawerBody>
        </AkDrawerContent>
      </AkDrawer>
    </SettingsPanel>
  );
}
