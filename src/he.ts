import { Field } from "o1js";
import { ElGamalFF, Cipher } from "./elgamal";

export function encrypt(value: Field, pk: Field): Cipher {
  return ElGamalFF.encrypt(value, pk);
}

export function decrypt(encryptedValue: Cipher, sk: Field): Field {
  return ElGamalFF.decrypt(encryptedValue, sk);
}

export function generateKeys(): { pk: Field; sk: Field } {
  const keys = ElGamalFF.generateKeys();
  return { pk: keys.pk, sk: keys.sk };
}
