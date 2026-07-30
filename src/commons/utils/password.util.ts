import bcrypt from 'bcrypt';

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password.trim(), 10);
};

export const comparePassword = async (
  input: string,
  hashedPassword: string,
): Promise<boolean> => {
  return await bcrypt.compare(input.trim(), hashedPassword.trim());
};
