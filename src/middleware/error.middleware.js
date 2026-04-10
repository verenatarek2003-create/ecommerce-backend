export const notFoundMiddleware = (req, res) => {
  return res.fail('Not found', 404);
};

export const errorMiddleware = (err, req, res, _next) => {
  console.error(err);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.fail('File too large (max 5MB per file)', 400);
    }
    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.fail('Too many files or unexpected field name', 400);
    }
    return res.fail(err.message || 'Upload failed', 400);
  }

  if (err.name === 'ValidationError') {
    return res.fail('Validation failed', 400, err.errors);
  }

  if (err.code === 11000) {
    return res.fail('Duplicate key error', 409, err.keyValue);
  }

  if (err.name === 'CastError') {
    return res.fail(`Invalid ${err.path}`, 400);
  }

  const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
  const message = err.message || 'Internal server error';
  return res.fail(message, statusCode, err.details || null);
};

