export const pathFileName = (
  file: Express.Multer.File | null,
  path: string,
): string => {
  if (!file) return '';
  return `${path}/${file.filename}`;
};
