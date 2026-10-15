import { SelectLanguage } from './components/select-language';

/**
 * The general tab of account settings. It holds the language setting alone,
 * as irene's does.
 */
export function GeneralSettingsPage() {
  return (
    <div className="flex flex-col p-5.25" data-test-general-settings>
      <SelectLanguage />
    </div>
  );
}
