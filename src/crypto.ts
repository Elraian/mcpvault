import { argon2id } from "@noble/hashes/argon2";
import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

const KDF_PARAMS = {
  // OWASP 2024 minimums for interactive auth — generous on memory, low t for snappy unlock.
  m: 64 * 1024, // 64 MiB
  t: 3,
  p: 1,
  dkLen: 32, // 256-bit key for AES-256
} as const;

const SALT_BYTES = 16;
const NONCE_BYTES = 12; // AES-GCM standard
const TAG_BYTES = 16;

// On-disk file format (binary):
//   magic    (4)  "MVLT"
//   version  (1)  0x01
//   m        (4)  uint32 BE — Argon2 memory (KiB)
//   t        (1)  uint8     — Argon2 iterations
//   p        (1)  uint8     — Argon2 parallelism
//   salt     (16) bytes
//   nonce    (12) bytes
//   tag      (16) bytes
//   ciphertext (rest)
const MAGIC = Buffer.from("MVLT", "ascii");
const VERSION = 0x01;

export interface VaultParams {
  m: number;
  t: number;
  p: number;
  salt: Buffer;
}

export function deriveKey(password: string, params: Omit<VaultParams, "salt"> & { salt: Buffer }): Buffer {
  const key = argon2id(password, params.salt, {
    m: params.m,
    t: params.t,
    p: params.p,
    dkLen: KDF_PARAMS.dkLen,
  });
  return Buffer.from(key);
}

export function newSalt(): Buffer {
  return randomBytes(SALT_BYTES);
}

export function encryptVault(plaintext: Buffer | string, password: string): Buffer {
  const salt = newSalt();
  const params: VaultParams = { m: KDF_PARAMS.m, t: KDF_PARAMS.t, p: KDF_PARAMS.p, salt };
  const key = deriveKey(password, params);
  const nonce = randomBytes(NONCE_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  const buf = typeof plaintext === "string" ? Buffer.from(plaintext, "utf8") : plaintext;
  const ct = Buffer.concat([cipher.update(buf), cipher.final()]);
  const tag = cipher.getAuthTag();
  return packFile(params, nonce, tag, ct);
}

export function encryptVaultWithKey(plaintext: Buffer | string, key: Buffer, params: VaultParams): Buffer {
  if (key.length !== KDF_PARAMS.dkLen) throw new Error("invalid key length");
  const nonce = randomBytes(NONCE_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  const buf = typeof plaintext === "string" ? Buffer.from(plaintext, "utf8") : plaintext;
  const ct = Buffer.concat([cipher.update(buf), cipher.final()]);
  const tag = cipher.getAuthTag();
  return packFile(params, nonce, tag, ct);
}

export interface DecryptResult {
  plaintext: Buffer;
  key: Buffer;
  params: VaultParams;
}

export function decryptVault(blob: Buffer, password: string): DecryptResult {
  const { params, nonce, tag, ct } = unpackFile(blob);
  const key = deriveKey(password, params);
  const decipher = createDecipheriv("aes-256-gcm", key, nonce);
  decipher.setAuthTag(tag);
  let plaintext: Buffer;
  try {
    plaintext = Buffer.concat([decipher.update(ct), decipher.final()]);
  } catch {
    throw new Error("vault decrypt failed: wrong password or corrupt file");
  }
  return { plaintext, key, params };
}

function packFile(params: VaultParams, nonce: Buffer, tag: Buffer, ct: Buffer): Buffer {
  const header = Buffer.alloc(4 + 1 + 4 + 1 + 1 + SALT_BYTES + NONCE_BYTES + TAG_BYTES);
  let o = 0;
  MAGIC.copy(header, o);
  o += 4;
  header.writeUInt8(VERSION, o);
  o += 1;
  header.writeUInt32BE(params.m, o);
  o += 4;
  header.writeUInt8(params.t, o);
  o += 1;
  header.writeUInt8(params.p, o);
  o += 1;
  params.salt.copy(header, o);
  o += SALT_BYTES;
  nonce.copy(header, o);
  o += NONCE_BYTES;
  tag.copy(header, o);
  return Buffer.concat([header, ct]);
}

function unpackFile(blob: Buffer): { params: VaultParams; nonce: Buffer; tag: Buffer; ct: Buffer } {
  if (blob.length < 4 + 1 + 4 + 1 + 1 + SALT_BYTES + NONCE_BYTES + TAG_BYTES) {
    throw new Error("vault file too short");
  }
  if (!blob.subarray(0, 4).equals(MAGIC)) throw new Error("not a vault file (bad magic)");
  let o = 4;
  const version = blob.readUInt8(o);
  o += 1;
  if (version !== VERSION) throw new Error(`unsupported vault version ${version}`);
  const m = blob.readUInt32BE(o);
  o += 4;
  const t = blob.readUInt8(o);
  o += 1;
  const p = blob.readUInt8(o);
  o += 1;
  const salt = blob.subarray(o, o + SALT_BYTES);
  o += SALT_BYTES;
  const nonce = blob.subarray(o, o + NONCE_BYTES);
  o += NONCE_BYTES;
  const tag = blob.subarray(o, o + TAG_BYTES);
  o += TAG_BYTES;
  const ct = blob.subarray(o);
  return { params: { m, t, p, salt: Buffer.from(salt) }, nonce: Buffer.from(nonce), tag: Buffer.from(tag), ct: Buffer.from(ct) };
}
