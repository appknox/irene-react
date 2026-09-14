/**
 * Derives the extras irene attaches to every enum group: UNKNOWN, CHOICES,
 * VALUES and their BASE_ counterparts.
 *
 * Computed rather than written out, so a group and its choices cannot drift.
 */
export const UNKNOWN = -1;

export interface Choice<TValue> {
  key: string;
  value: TValue;
}

type EnumGroup = Record<string, string | number>;

export type ExtendedGroup<TGroup extends EnumGroup> = TGroup & {
  UNKNOWN: typeof UNKNOWN;
  BASE_VALUES: TGroup[keyof TGroup][];
  VALUES: (TGroup[keyof TGroup] | typeof UNKNOWN)[];

  /** Entries as declared. */
  BASE_CHOICES: Choice<TGroup[keyof TGroup]>[];
  /** As BASE_CHOICES, plus UNKNOWN. */
  CHOICES: Choice<TGroup[keyof TGroup] | typeof UNKNOWN>[];
};

export type ExtendedEnums<TGroups extends Record<string, EnumGroup>> = {
  [TName in keyof TGroups]: ExtendedGroup<TGroups[TName]>;
};

function extendGroup<TGroup extends EnumGroup>(group: TGroup): ExtendedGroup<TGroup> {
  const baseChoices = Object.entries(group).map(([key, value]) => ({ key, value })) as Choice<
    TGroup[keyof TGroup]
  >[];

  const baseValues = baseChoices.map((choice) => choice.value);

  return {
    ...group,
    UNKNOWN,
    BASE_CHOICES: baseChoices,
    BASE_VALUES: baseValues,
    CHOICES: [...baseChoices, { key: 'UNKNOWN', value: UNKNOWN }],
    VALUES: [...baseValues, UNKNOWN],
  };
}

export function extendEnums<TGroups extends Record<string, EnumGroup>>(
  groups: TGroups
): ExtendedEnums<TGroups> {
  return Object.fromEntries(
    Object.entries(groups).map(([name, group]) => [name, extendGroup(group)])
  ) as ExtendedEnums<TGroups>;
}
