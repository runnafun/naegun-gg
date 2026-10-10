import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";

import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

export async function hashAdminPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyAdminPassword(
  password: string,
  storedHash: string,
) {
  const [salt, keyHex] = storedHash.split(":");

  if (!salt || !keyHex) {
    return false;
  }

  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const storedKey = Buffer.from(keyHex, "hex");

  if (derivedKey.length != storedKey.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, storedKey);
}
