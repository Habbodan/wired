import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const VERSION = 'v1';

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function sha256Base64Url(value: string): string {
  return createHash('sha256').update(value).digest('base64url');
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export interface Sealer {
  seal(plaintext: string, context: string): string;
  open(sealed: string, context: string): string;
}

export function createSealer(key: Buffer): Sealer {
  if (key.length !== 32) throw new Error('Sealer key must be 32 bytes');

  return {
    seal(plaintext, context) {
      const iv = randomBytes(IV_BYTES);
      const cipher = createCipheriv(ALGORITHM, key, iv);
      cipher.setAAD(Buffer.from(context));
      const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
      return [VERSION, iv, cipher.getAuthTag(), ciphertext]
        .map((part) => (typeof part === 'string' ? part : part.toString('base64url')))
        .join('.');
    },

    open(sealed, context) {
      const [version, iv, tag, ciphertext] = sealed.split('.');
      if (version !== VERSION || !iv || !tag || ciphertext === undefined) {
        throw new Error('Malformed sealed value');
      }
      const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'base64url'));
      decipher.setAAD(Buffer.from(context));
      decipher.setAuthTag(Buffer.from(tag, 'base64url'));
      return Buffer.concat([
        decipher.update(Buffer.from(ciphertext, 'base64url')),
        decipher.final(),
      ]).toString('utf8');
    },
  };
}
