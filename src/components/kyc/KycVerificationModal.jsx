import DigiLockerAgeVerificationModal from './DigiLockerAgeVerificationModal';
import PayoutKycModal from './PayoutKycModal';

const KycVerificationModal = ({ mode, user, actions = {}, onClose }) => {
  if (mode === 'identity' || mode === 'age') {
    return (
      <DigiLockerAgeVerificationModal
        user={user}
        actions={actions}
        onClose={onClose}
      />
    );
  }

  if (mode === 'banking' || mode === 'payout') {
    return (
      <PayoutKycModal
        user={user}
        actions={actions}
        onClose={onClose}
      />
    );
  }

  return null;
};

export default KycVerificationModal;

