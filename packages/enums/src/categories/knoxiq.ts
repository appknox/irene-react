export const KNOXIQ_ENUMS = {
  KNOXIQ_EXPLOITABILITY: {
    EXP_UNKNOWN: 0,
    PASSED: 1,
    LOW: 2,
    MEDIUM: 3,
    HIGH: 4,
  },

  KNOXIQ_SCAN_STATUS: {
    LEGACY: -1,
    DISABLED: 0,
    NOT_TRIGGERED: 1,
    PENDING: 2,
    RUNNING: 3,
    COMPLETED: 4,
    ERRORED: 5,
  },

  KNOXIQ_SCAN_TYPE: {
    SAST: 1,
    DAST_MANUAL: 2,
    DAST_AUTOMATED: 3,
    API: 4,
  },
} as const;
