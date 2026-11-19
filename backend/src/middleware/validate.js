export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) return next(result.error);
  req[source === 'query' ? 'validatedQuery' : 'validated'] = result.data;
  next();
};
