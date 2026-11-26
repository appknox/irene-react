import { useCallback, useEffect, useState } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkInput } from '@irene/ui/ak-input';

/** How long typing has to stop before the search runs, as irene waits. */
const SEARCH_DEBOUNCE_MS = 500;

interface ListingSearchProps {
  query: string;
  onSearch: (query: string) => void;
}

/**
 * The search box above a StoreKnox listing: the fake-app cards and the third-party scans.
 *
 * It keeps what is typed itself and reports it once typing has paused, so a search is not sent
 * per keystroke; clearing reports at once. A search the URL already carries fills the field. Text
 * is compared and reported trimmed, as the URL holds it, so surrounding spaces never search twice.
 * Clearing a field the URL has no search for only empties the text, leaving the page where it is.
 *
 * @param props.query - The search the page is showing, from the URL.
 * @param props.onSearch - Called with the typed text a pause after the last keystroke, or with an empty string on clear.
 */
export function ListingSearch({ query, onSearch }: Readonly<ListingSearchProps>) {
  const [text, setText] = useState(query);
  const [seenQuery, setSeenQuery] = useState(query);
  const [reportedText, setReportedText] = useState(query);

  /*
    A `q` this field did not write itself, such as the one back or forward restores, replaces
    what is typed; otherwise the pause below would navigate straight back to the typed text.
  */
  if (query !== seenQuery) {
    setSeenQuery(query);

    if (query !== reportedText) {
      setText(query);
      setReportedText(query);
    }
  }

  const report = useCallback(
    (value: string) => {
      setReportedText(value);
      onSearch(value);
    },
    [onSearch]
  );

  useEffect(() => {
    const trimmed = text.trim();

    if (trimmed === query) {
      return undefined;
    }

    const timer = setTimeout(() => report(trimmed), SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [text, query, report]);

  const clear = () => {
    setText('');

    if (query) {
      report('');
    }
  };

  return (
    <div className="relative w-64 max-w-full bg-background">
      <AkInput
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={akMT('searchQuery')}
        aria-label={akMT('searchQuery')}
        className="h-8 pr-9 text-sm placeholder:text-sm"
        data-test-sk-listing-search-input
      />

      <span className="absolute inset-y-0 right-1 flex items-center">
        {text ? (
          <AkIconButton size="small" aria-label={akMT('clear')} onClick={clear}>
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
  );
}
