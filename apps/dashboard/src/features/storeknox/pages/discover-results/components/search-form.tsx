import { useState, type FormEvent } from 'react';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkInput } from '@irene/ui/ak-input';
import { akNotify } from '@irene/ui/notify';

interface SearchFormProps {
  initialQuery: string;
  isSearching: boolean;
  onSearch: (query: string) => void;
}

/**
 * The store search field and Discover button; a one-character query is refused, as irene's `discoverApp` refuses it.
 *
 * @param props.initialQuery - The search the page is showing.
 * @param props.isSearching - Whether a search is being started, which spins the button.
 * @param props.onSearch - Called with a query long enough to send.
 */
export function SearchForm({ initialQuery, isSearching, onSearch }: Readonly<SearchFormProps>) {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (query.length > 1) {
      onSearch(query);
    } else {
      akNotify.error(akMT('storeknox.errorSearchCharacter'));
    }
  };

  return (
    <form role="search" className="flex items-center gap-2.5" onSubmit={handleSubmit}>
      <div className="relative w-132.5 max-w-full bg-background">
        <AkInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={akMT('storeknox.searchQuery')}
          aria-label={akMT('storeknox.searchQuery')}
          className="pr-10"
          data-test-sk-discovery-search-input
        />

        <span className="absolute inset-y-0 right-1 flex items-center">
          {query ? (
            <AkIconButton size="small" aria-label={akMT('clear')} onClick={() => setQuery('')}>
              <AkIcon name="material-symbols:close" />
            </AkIconButton>
          ) : (
            <AkIcon
              name="material-symbols:search"
              className="mr-2 size-5 text-foreground-muted"
              aria-hidden="true"
            />
          )}
        </span>
      </div>

      <AkButton type="submit" disabled={!query} loading={isSearching}>
        <AkMessageTranslate id="storeknox.discoverHeader" />
      </AkButton>
    </form>
  );
}
