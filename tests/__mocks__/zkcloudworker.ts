import { PrivateKey } from 'o1js';

export const initBlockchain = (network: string, numAccounts: number) => {
  const keys = Array.from({ length: numAccounts }, () => ({
    privateKey: PrivateKey.random(),
    publicKey: PrivateKey.random().toPublicKey(),
  }));
  
  return {
    keys,
  };
}; 