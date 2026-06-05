export const PASSWORD_SECURITY_ERROR =
  'Use a stronger password: 7+ characters, uppercase and lowercase letters, a number, and a special character.';

export const PASSWORD_SECURITY_RULES = [
  {
    id: 'length',
    label: '7+ characters',
    test: (password) => password.length >= 7,
  },
  {
    id: 'uppercase',
    label: 'Uppercase letter',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: 'lowercase',
    label: 'Lowercase letter',
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: 'number',
    label: 'Number',
    test: (password) => /\d/.test(password),
  },
  {
    id: 'special',
    label: 'Special character',
    test: (password) => /[^\sA-Za-z0-9]/.test(password),
  },
];

export const getPasswordSecurityStatus = (password = '') => {
  const checks = PASSWORD_SECURITY_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(password),
  }));
  const passedCount = checks.filter((check) => check.passed).length;
  const total = checks.length;

  return {
    checks,
    passedCount,
    total,
    progress: Math.round((passedCount / total) * 100),
    isStrong: passedCount === total,
  };
};
