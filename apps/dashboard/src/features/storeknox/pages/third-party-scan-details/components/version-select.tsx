import { akMT } from '@irene/translations/intl';

import {
  AkSelect,
  AkSelectContent,
  AkSelectItem,
  AkSelectTrigger,
  AkSelectValue,
} from '@irene/ui/ak-select';

interface VersionSelectProps {
  versions: string[];
  value: string;
  onChange: (version: string) => void;
}

/**
 * The scanned versions of an app as a select of `v<version>` options. The shown version is an
 * option even when the app's list leaves it out, so the trigger is never blank.
 *
 * @param props.versions - The versions the app has been scanned at.
 * @param props.value - The version shown as chosen.
 * @param props.onChange - Called with the version the user picks.
 */
export function VersionSelect({ versions, value, onChange }: Readonly<VersionSelectProps>) {
  const options = versions.includes(value) ? versions : [value, ...versions];

  return (
    <AkSelect value={value} onValueChange={onChange}>
      <AkSelectTrigger aria-label={akMT('version')} className="min-w-35">
        <AkSelectValue />
      </AkSelectTrigger>

      <AkSelectContent position="popper" side="bottom" align="end">
        {options.map((version) => (
          <AkSelectItem key={version} value={version}>
            v{version}
          </AkSelectItem>
        ))}
      </AkSelectContent>
    </AkSelect>
  );
}
