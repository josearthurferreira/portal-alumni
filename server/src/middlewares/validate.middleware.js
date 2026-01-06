function validateBody(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Body inválido',
        issues: parsed.error.issues,
      });
    }
    req.body = parsed.data;
    next();
  };
}

function validateQuery(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Query inválida',
        issues: parsed.error.issues,
      });
    }
    req.query = parsed.data;
    next();
  };
}
module.exports = { validateBody, validateQuery };
