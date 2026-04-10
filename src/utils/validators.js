export const isValidEmail = (email) => {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidPassword = (password) => {
  return typeof password === 'string' && password.length >= 6;
};

export const parsePagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const normalizeNonNegativeIntStock = (value, label = 'Stock') => {
  const n = Number(value);
  if (value === '' || value === null || value === undefined || Number.isNaN(n)) {
    return { error: `${label} must be a number` };
  }
  if (!Number.isInteger(n) || n < 0) {
    return { error: `${label} must be a non-negative integer` };
  }
  return { value: n };
};

