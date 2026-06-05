export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim().toLowerCase());

export const normalizeIndianPhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '').replace(/^0+/, '');
  const local = digits.startsWith('91') && digits.length === 12
    ? digits.slice(2)
    : digits;

  if (!/^[6-9]\d{9}$/.test(local)) {
    throw new Error('Enter a valid Indian mobile number.');
  }

  return `+91${local}`;
};

export const toMsg91Identifier = (phone) => normalizeIndianPhone(phone).replace('+', '');
