import slugify from 'slugify';

export const generateSlug = (name?: string): string => {
  if (!name) return '';
  return slugify(name, {
    lower: true,
    strict: true,
  });
};
