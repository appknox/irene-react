export const AI_REPORTING_ENUMS = {
  /** Where a report request stands; irene declares it on its report-request model (`AiReportingStatus`). */
  AI_REPORTING_REQUEST_STATUS: {
    PENDING: 0,
    PROCESSING: 1,
    COMPLETED: 2,
    FAILED: 3,
  },

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
