export const notFoundMiddleware = (req, res) => {
  return res.fail('Not found', 404);
};

export const errorMiddleware = (err, req, res, _next) => {
  console.error(err);

  if (err.name === 'ValidationError') {
    return res.fail('Validation failed', 400, err.errors);
  }

  if (err.code === 11000) {
    return res.fail('Duplicate key error', 409, err.keyValue);
  }

  if (err.name === 'CastError') {
    return res.fail(`Invalid ${err.path}`, 400);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  return res.fail(message, statusCode, err.details || null);
};

