export const AI_REPORTING_ENUMS = {
  AI_REPORTING_FIELD_TYPE: {
    STRING: 'string',
    INTEGER: 'integer',
    NUMBER: 'number',
    FLOAT: 'float',
    DATETIME: 'datetime',
    BOOLEAN: 'boolean',
  },

  AI_REPORTING_FILTER_OPERATOR: {
    EQ: 'eq',
    NEQ: 'neq',
    GT: 'gt',
    GTE: 'gte',
    LT: 'lt',
    LTE: 'lte',
    IN: 'in',
    NOT_IN: 'not_in',
    CONTAINS: 'contains',
    ICONTAINS: 'icontains',
    STARTSWITH: 'startswith',
    ENDSWITH: 'endswith',
    RANGE: 'range',
    EXISTS: 'exists',
    ISNULL: 'isnull',
  },
} as const;
