import {
  AkSelect,
  AkSelectContent,
  AkSelectItem,
  AkSelectTrigger,
  AkSelectValue,
} from '@irene/ui/ak-select';

import type { ApiReportFilterField } from '@irene/api/services/report-request';
import { akMT } from '@irene/translations/intl';
import { AkCheckbox } from '@irene/ui/ak-checkbox';
import { AkInput } from '@irene/ui/ak-input';
import { AkTypography } from '@irene/ui/ak-typography';

import type { FilterCondition } from './state';

const NUMBER_TYPES = new Set(['integer', 'float', 'number']);
const DATE_TYPES = new Set(['datetime', 'date']);

const BOOLEAN_CHOICES = [
  { value: 'true', label: 'True' },
  { value: 'false', label: 'False' },
];

interface FilterValueProps {
  field: ApiReportFilterField;
  condition: FilterCondition;
  onChange: (value: FilterCondition['value']) => void;
}

/**
 * The value half of a filter condition, shaped by the column: a pick list for
 * fixed values (ticks for any of / none of), a date for dates, a number for
 * numbers and text otherwise. "Is empty" needs no value.
 *
 * @param props.field - The column filtered.
 * @param props.condition - The condition being edited.
 * @param props.onChange - Receives the new value.
 */
export function FilterValue({ field, condition, onChange }: Readonly<FilterValueProps>) {
  const label = akMT('reportModule.view.filterValue', { column: field.label });

  if (condition.operator === 'isnull') {
    return null;
  }

  const choices = field.choices?.length ? field.choices : field.type === 'boolean' ? BOOLEAN_CHOICES : null;

  if (choices && (condition.operator === 'in' || condition.operator === 'not_in')) {
    const picked = new Set(Array.isArray(condition.value) ? condition.value : []);

    return (
      <div role="group" aria-label={label} className="flex max-h-32 min-w-40 flex-1 flex-col gap-1 overflow-y-auto">
        {choices.map((choice) => (
          <label key={choice.value} className="flex cursor-pointer items-center gap-2">
            <AkCheckbox
              checked={picked.has(choice.value)}
              onCheckedChange={(checked) =>
                onChange(
                  checked === true
                    ? [...picked, choice.value]
                    : [...picked].filter((value) => value !== choice.value)
                )
              }
            />

            <AkTypography tag="span">{choice.label}</AkTypography>
          </label>
        ))}
      </div>
    );
  }

  if (choices) {
    return (
      <AkSelect value={condition.value === null ? undefined : String(condition.value)} onValueChange={onChange}>
        <AkSelectTrigger aria-label={label} className="min-w-40 flex-1">
          <AkSelectValue placeholder={akMT('reportModule.advancedFilters.selectValue', { label: field.label })} />
        </AkSelectTrigger>

        <AkSelectContent position="popper">
          {choices.map((choice) => (
            <AkSelectItem key={choice.value} value={choice.value}>
              {choice.label}
            </AkSelectItem>
          ))}
        </AkSelectContent>
      </AkSelect>
    );
  }

  return (
    <AkInput
      aria-label={label}
      type={DATE_TYPES.has(field.type) ? 'date' : NUMBER_TYPES.has(field.type) ? 'number' : 'text'}
      value={condition.value === null || Array.isArray(condition.value) ? '' : String(condition.value)}
      placeholder={akMT('reportModule.advancedFilters.enterValue')}
      wrapperClassName="min-w-40 flex-1"
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
