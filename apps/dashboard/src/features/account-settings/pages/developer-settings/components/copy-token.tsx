import { akMT } from '@irene/translations/intl';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

/**
 * Copies a token's key to the clipboard.
 *
 * @param props.tokenKey - The key to copy.
 * @param props.tokenName - The token's name, which names the control for a screen reader.
 */
export function CopyToken({
  tokenKey,
  tokenName,
}: Readonly<{ tokenKey: string; tokenName: string }>) {
  const { copy } = useCopyToClipboard({ successMessage: akMT('tokenCopied') });

  return (
    <AkIconButton
      size="small"
      onClick={() => copy(tokenKey)}
      aria-label={`${akMT('copy')} ${tokenName}`}
      className="text-info"
      data-test-personal-token-copy
    >
      <AkIcon name="material-symbols:content-copy-outline" />
    </AkIconButton>
  );
}
