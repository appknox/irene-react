import { akMT } from '@irene/translations/intl';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { akNotify } from '@irene/ui/notify';

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
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(tokenKey);
      akNotify.info(akMT('tokenCopied'));
    } catch {
      /* A browser that refuses the clipboard (an insecure origin, a denied permission) says so here. */
      akNotify.error(akMT('pleaseTryAgain'));
    }
  };

  return (
    <AkIconButton
      size="small"
      onClick={copy}
      aria-label={`${akMT('copy')} ${tokenName}`}
      className="text-info"
      data-test-personal-token-copy
    >
      <AkIcon name="material-symbols:content-copy-outline" />
    </AkIconButton>
  );
}
