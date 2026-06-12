export const KYC_STAGES = {
  NONE: 'none',
  AGE_VERIFIED: 'age_verified',
  PAYOUT_KYC_PENDING: 'payout_kyc_pending',
  PAYOUT_READY: 'payout_ready',
  FULLY_VERIFIED: 'fully_verified',
};

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export const getUserDob = (user) => user?.temp_dob || user?.dob || '';

export const calculateAgeFromDob = (dob) => {
  if (!dob) return null;

  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return age;
};

export const isMinorUser = (user) => {
  if (user?.kyc_type === 'minor') return true;
  const age = calculateAgeFromDob(getUserDob(user));
  return age !== null ? age < 18 : false;
};

export const hasAgeVerification = (user) => Boolean(
  user?.digilocker_verified ||
  user?.kyc_status === KYC_STAGES.AGE_VERIFIED ||
  user?.kyc_status === KYC_STAGES.PAYOUT_KYC_PENDING ||
  user?.kyc_status === KYC_STAGES.PAYOUT_READY ||
  user?.kyc_status === KYC_STAGES.FULLY_VERIFIED ||
  user?.is_kyc_verified ||
  ['approved', 'verified'].includes(user?.kyc_status)
);

export const hasPayoutKyc = (user) => Boolean(
  user?.kyc_status === KYC_STAGES.PAYOUT_READY ||
  user?.kyc_status === KYC_STAGES.FULLY_VERIFIED ||
  user?.is_kyc_verified ||
  ['approved', 'verified'].includes(user?.kyc_status)
);

