export const PRIVACY_ENUMS = {
  PM_ANALYSIS_STATUS: {
    IN_PROGRESS: 1,
    COMPLETED: 2,
    FAILED: 3,
  },

  PM_DANGER_PERMS_STATUS: {
    STARTED: 0,
    PENDING: 1,
    SUCCESS: 2,
    FAILED: 3,
  },

  PM_PII_STATUS: {
    STARTED: 0,
    PENDING: 1,
    SUCCESS: 2,
    FAILED: 3,
    PARTIAL_SUCCESS: 4,
  },

  PM_REPORT_STATUS: {
    PENDING: 1,
    STARTED: 2,
    IN_PROGRESS: 3,
    COMPLETED: 4,
    FAILED: 5,
  },

  PM_STATUS: {
    IN_PROGRESS: 0,
    COMPLETED: 1,
    FAILED: 2,
  },

  PM_TRACKER_STATUS: {
    STARTED: 0,
    PENDING: 1,
    SUCCESS: 2,
    FAILED: 3,
  },
} as const;
