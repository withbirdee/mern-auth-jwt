import { hash, compare } from "bcrypt";

export async function hashValue(value: string, saltRounds = 10) {
  return await hash(value, saltRounds);
}

export async function compareValue(password: string, passwordHash: string) {
  return await compare(password, passwordHash);
}
