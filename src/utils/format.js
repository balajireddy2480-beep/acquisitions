export const formatValidationError = error => {
  if (!error || !error.errors) return 'validation failed';

  if (Array.isArray(error.errors))
    return error.issues.map(i => i.message).join(', ');

  return JSON.stringify(errors);
};
