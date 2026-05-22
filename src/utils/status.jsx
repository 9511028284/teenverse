// src/utils/status.js

export const APP_STATUS = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  SUBMITTED: 'Submitted',
  COMPLETED: 'Completed',
  PAID: 'Paid',
  REJECTED: 'Rejected'
};

// State Machine: Defines exactly what moves are legal
export const NEXT_ALLOWED_STATE = {
  [APP_STATUS.PENDING]: [APP_STATUS.ACCEPTED, APP_STATUS.REJECTED],
  [APP_STATUS.ACCEPTED]: [APP_STATUS.SUBMITTED, APP_STATUS.REJECTED], // Freelancer submits or Client cancels
  [APP_STATUS.SUBMITTED]: [APP_STATUS.COMPLETED, APP_STATUS.ACCEPTED], // Client approves or requests revision (back to Accepted)
  [APP_STATUS.COMPLETED]: [APP_STATUS.PAID],      // Only payment allowed next
  [APP_STATUS.PAID]: [],                          // End of workflow
  [APP_STATUS.REJECTED]: []                       // End of workflow
};