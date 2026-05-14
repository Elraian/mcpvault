import { describe, it, expect } from "vitest";
import { encryptVault, decryptVault, encryptVaultWithKey } from "../src/crypto.js";

describe("crypto", () => {
  it("roundtrips a small payload", () => {
    const blob = encryptVault("hello world", "correct horse battery staple");
    const { plaintext } = decryptVault(blob, "correct horse battery staple");
    expect(plaintext.toString("utf8")).toBe("hello world");
  });

  it("roundtrips a JSON payload", () => {
    const data = JSON.stringify({ accounts: [{ service: "supabase", label: "personal", pat: "sbp_xxx" }] });
    const blob = encryptVault(data, "pw");
    const { plaintext } = decryptVault(blob, "pw");
    expect(JSON.parse(plaintext.toString("utf8"))).toEqual(JSON.parse(data));
  });

  it("rejects wrong password", () => {
    const blob = encryptVault("secret", "right");
    expect(() => decryptVault(blob, "wrong")).toThrow(/decrypt failed/);
  });

  it("rejects corrupted ciphertext", () => {
    const blob = encryptVault("secret", "pw");
    blob[blob.length - 1] ^= 0xff;
    expect(() => decryptVault(blob, "pw")).toThrow(/decrypt failed/);
  });

  it("rejects bad magic", () => {
    const blob = Buffer.alloc(64, 0);
    expect(() => decryptVault(blob, "pw")).toThrow(/bad magic/);
  });

  it("re-encrypts with cached key (no KDF rerun)", () => {
    const blob = encryptVault("seed", "pw");
    const { key, params, plaintext } = decryptVault(blob, "pw");
    expect(plaintext.toString("utf8")).toBe("seed");
    const updated = encryptVaultWithKey("seed-v2", key, params);
    const re = decryptVault(updated, "pw");
    expect(re.plaintext.toString("utf8")).toBe("seed-v2");
  });

  it("produces different ciphertexts for the same plaintext (random salt + nonce)", () => {
    const a = encryptVault("same", "pw");
    const b = encryptVault("same", "pw");
    expect(a.equals(b)).toBe(false);
  });
});
