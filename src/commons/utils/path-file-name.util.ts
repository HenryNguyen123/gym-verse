export const pathFileName = (file: Express.Multer.File, path: string) => {
  return `${path}/${file.filename}`;
};
