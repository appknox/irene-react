import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { OrganizationService } from '@irene/api/services/organization';
import { getApiErrorMessage } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkInput } from '@irene/ui/ak-input';
import { AkLabel } from '@irene/ui/ak-label';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import { useOrganization } from '@/hooks/use-organization';
import { organizationKeys } from '@/queries/organization';

import { fileToBase64 } from './file-to-base64';

interface CertUploadFormProps {
  /** Called once the certificate is stored, so the list behind it is read again. */
  onUploaded: () => void;
  onCancel: () => void;
}

/** The file a caller has chosen, or the control for choosing one. */
function FilePicker({
  id,
  label,
  accept,
  file,
  onPick,
  onClear,
}: Readonly<{
  id: string;
  label: string;
  accept: string;
  file: File | null;
  onPick: (file: File | null) => void;
  onClear: () => void;
}>) {
  return (
    <div className="flex flex-col gap-1">
      <AkLabel htmlFor={id} className="font-medium text-foreground-muted">
        {label}
      </AkLabel>

      {file === null ? (
        <div className="flex items-center gap-1.75">
          <AkButton asChild variant="outlined">
            <label className="cursor-pointer">
              <AkIcon name="material-symbols:file-upload" className="size-4" aria-hidden />

              {akMT('chooseFile')}

              <input
                id={id}
                type="file"
                accept={accept}
                aria-label={label}
                className="hidden"
                onChange={(event) => onPick(event.target.files?.[0] ?? null)}
                data-test-org-signing-cert-file={id}
              />
            </label>
          </AkButton>

          <AkTypography variant="body2" color="textSecondary" className="italic">
            {akMT('noFileChosen')}
          </AkTypography>
        </div>
      ) : (
        <div
          className="flex w-fit items-center gap-1.75 rounded-xs border border-border px-2.75 py-1"
          data-test-org-signing-cert-file-chip={id}
        >
          <AkTypography variant="body2">{file.name}</AkTypography>

          <AkIconButton
            type="button"
            size="small"
            aria-label={akMT('remove')}
            onClick={onClear}
            data-test-org-signing-cert-file-clear={id}
          >
            <AkIcon name="material-symbols:close" className="size-4" />
          </AkIconButton>
        </div>
      )}
    </div>
  );
}

/**
 * Where a signing certificate is added.
 *
 * Both files and the password are required; the name and the bundle id are not,
 * as irene marks them optional. The material goes up base64-encoded in a JSON
 * body, which is how the endpoint takes it.
 *
 * @param props.onUploaded - Called once it is stored.
 * @param props.onCancel - Called to leave without adding one.
 */
export function CertUploadForm({ onUploaded, onCancel }: Readonly<CertUploadFormProps>) {
  const queryClient = useQueryClient();
  const { selected } = useOrganization();

  const [name, setName] = useState('');
  const [bundleId, setBundleId] = useState('');
  const [password, setPassword] = useState('');
  const [p12, setP12] = useState<File | null>(null);
  const [profile, setProfile] = useState<File | null>(null);

  const upload = useMutation({
    mutationFn: async (files: { p12: File; profile: File }) => {
      const [encodedP12, encodedProfile] = await Promise.all([
        fileToBase64(files.p12),
        fileToBase64(files.profile),
      ]);

      return await OrganizationService.addOrganizationSigningCertificate(Number(selected?.id), {
        p12: encodedP12,
        mobileprovision: encodedProfile,
        password,
        name,
        bundle_id: bundleId.trim(),
      });
    },

    onSuccess: async () => {
      akNotify.success(akMT('cyod.signingCert.uploadSuccess'));

      setName('');
      setBundleId('');
      setPassword('');
      setP12(null);
      setProfile(null);

      await queryClient.invalidateQueries({
        queryKey: organizationKeys.signingCertificates(selected?.id),
      });

      onUploaded();
    },

    onError: (error) => {
      akNotify.error(getApiErrorMessage(error) ?? akMT('pleaseTryAgain'));
    },
  });

  const canSave = p12 !== null && profile !== null && password.trim() !== '';

  return (
    <form
      noValidate
      className="flex w-full flex-col"
      onSubmit={(event) => {
        event.preventDefault();

        if (p12 !== null && profile !== null) {
          upload.mutate({ p12, profile });
        }
      }}
      data-test-org-signing-cert-upload-form
    >
      <div className="flex flex-col gap-4.25 px-4.25 py-3.5">
        <div className="flex items-start gap-3.5">
          <div className="flex w-full flex-col gap-1">
            <AkLabel htmlFor="cert-name" className="font-medium text-foreground-muted">
              {akMT('cyod.signingCert.name')}
            </AkLabel>

            <AkInput
              id="cert-name"
              value={name}
              placeholder={akMT('cyod.signingCert.namePlaceholder')}
              onChange={(event) => setName(event.target.value)}
              data-test-org-signing-cert-name-input
            />
          </div>

          <div className="flex w-full flex-col gap-1">
            <AkLabel htmlFor="cert-bundle-id" className="font-medium text-foreground-muted">
              {akMT('cyod.signingCert.bundleIdLabel')}
            </AkLabel>

            <AkInput
              id="cert-bundle-id"
              value={bundleId}
              placeholder="com.mfva.myapp"
              onChange={(event) => setBundleId(event.target.value)}
              data-test-org-signing-cert-bundle-id-input
            />
          </div>
        </div>

        <div
          className="rounded-xs border border-border bg-background-subtle p-2.75"
          data-test-org-signing-cert-tip
        >
          <AkTypography variant="body2">
            <strong>{akMT('cyod.signingCert.tipLabel')}</strong>

            {` ${akMT('cyod.signingCert.bundleIdHint')}`}
          </AkTypography>
        </div>

        <AkDivider color="dark" />

        <FilePicker
          id="p12"
          label={akMT('cyod.signingCert.p12')}
          accept=".p12,.pfx"
          file={p12}
          onPick={setP12}
          onClear={() => setP12(null)}
        />

        <div className="flex w-1/2 flex-col gap-1">
          <AkLabel htmlFor="cert-password" className="font-medium text-foreground-muted">
            {akMT('cyod.signingCert.password')}

            <span className="text-primary"> *</span>
          </AkLabel>

          <AkInput
            id="cert-password"
            type="password"
            required
            autoComplete="new-password"
            value={password}
            placeholder={akMT('enterPassword')}
            onChange={(event) => setPassword(event.target.value)}
            data-test-org-signing-cert-password-input
          />
        </div>

        <AkDivider color="dark" />

        <FilePicker
          id="profile"
          label={akMT('cyod.signingCert.profile')}
          accept=".mobileprovision"
          file={profile}
          onPick={setProfile}
          onClear={() => setProfile(null)}
        />
      </div>

      <div className="flex items-center gap-1.75 px-4.25 py-3.5 shadow-4">
        <AkButton
          type="submit"
          disabled={!canSave}
          loading={upload.isPending}
          data-test-org-signing-cert-upload
        >
          {akMT('save')}
        </AkButton>

        <AkButton
          type="button"
          variant="outlined"
          color="neutral"
          disabled={upload.isPending}
          onClick={onCancel}
          data-test-org-signing-cert-cancel
        >
          {akMT('cancel')}
        </AkButton>
      </div>
    </form>
  );
}
