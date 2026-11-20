import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { PersonalTokenService } from '@irene/api/services/personal-token';
import { unlessRateLimited } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkFormProvider } from '@irene/ui/ak-form';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkInput } from '@irene/ui/ak-input';
import { akNotify } from '@irene/ui/notify';

import {
  buildPersonalTokenSchema,
  PersonalTokenFormField,
  type PersonalTokenFormSchema,
} from '@/features/account-settings/schemas/personal-token';

import { getFirstJsonApiError } from '@/features/account-settings/pages/developer-settings/utils';
import { personalTokenKeys } from '@/features/account-settings/queries/personal-token';

/**
 * Generates an API token under a name.
 *
 * Names are unique per account: a name already in use is refused with the
 * JSON:API code `unique`, which is said under the field. Any other refusal is
 * shown as the server words it.
 */
export function CreateTokenForm() {
  const queryClient = useQueryClient();
  const personalTokenSchema = buildPersonalTokenSchema();

  const tokenForm = useForm<PersonalTokenFormSchema>({
    resolver: zodResolver(personalTokenSchema),
    defaultValues: { name: '' },
    reValidateMode: 'onSubmit',
  });

  const createToken = useMutation({
    mutationFn: ({ name }: PersonalTokenFormSchema) =>
      PersonalTokenService.createPersonalToken(name),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: personalTokenKeys.list() });
      tokenForm.reset();

      akNotify.success(akMT('personalTokenGenerated'));
    },

    onError: unlessRateLimited((error) => {
      const complaint = getFirstJsonApiError(error);

      if (complaint?.code === 'unique') {
        tokenForm.setError('name', { message: akMT('personalTokenNameDuplicate') });
      } else {
        akNotify.error(complaint?.detail ?? akMT('somethingWentWrong'));
      }
    }),
  });

  return (
    <AkFormProvider {...tokenForm}>
      <form
        noValidate
        className="flex w-full max-w-162.5 items-start gap-2.5"
        onSubmit={tokenForm.handleSubmit((values) => createToken.mutate(values))}
        data-test-personal-token-form
      >
        <PersonalTokenFormField name="name" className="flex-1">
          <AkInput placeholder={akMT('name')} aria-label={akMT('name')} />
        </PersonalTokenFormField>

        <AkButton
          type="submit"
          loading={createToken.isPending}
          leftIcon={<AkIcon name="material-symbols:add" />}
        >
          {akMT('personalAccessTokenCreate')}
        </AkButton>
      </form>
    </AkFormProvider>
  );
}
