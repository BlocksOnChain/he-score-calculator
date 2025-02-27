// paillier.ts
// Basic Paillier encryption implementation in TypeScript

import {
  Field,
  Struct,
  Experimental,
  Circuit,
} from "o1js";

// Modular exponentiation: computes base^exponent mod modulus
function modExp(base: bigint, exponent: bigint, modulus: bigint): bigint {
    let result = 1n;
    base = base % modulus;
    while (exponent > 0n) {
        if (exponent % 2n === 1n) {
            result = (result * base) % modulus;
        }
        exponent = exponent / 2n;
        base = (base * base) % modulus;
    }
    return result;
}

// Extended Euclidean algorithm: returns {g, x, y} such that ax + by = g = gcd(a, b)
function egcd(a: bigint, b: bigint): { g: bigint; x: bigint; y: bigint } {
    if (a === 0n) {
        return { g: b, x: 0n, y: 1n };
    }
    const { g, x, y } = egcd(b % a, a);
    return { g, x: y - (b / a) * x, y: x };
}

// Modular inverse: returns the inverse of a modulo m
function modInv(a: bigint, m: bigint): bigint {
    const { g, x } = egcd(a, m);
    if (g !== 1n) {
        throw new Error("modular inverse does not exist");
    }
    return ((x % m) + m) % m;
}

// Greatest common divisor
function gcd(a: bigint, b: bigint): bigint {
    return b === 0n ? a : gcd(b, a % b);
}

// Least common multiple
function lcm(a: bigint, b: bigint): bigint {
    return (a * b) / gcd(a, b);
}

// Define Cipher struct similar to ElGamal
class PaillierCipher extends Struct({
  c: Field,
}) {
  // Homomorphic addition becomes multiplication modulo n^2
  add(other: PaillierCipher): PaillierCipher {
    return new PaillierCipher({ c: this.c.mul(other.c) });
  }

  // Homomorphic subtraction uses modular inverse
  sub(other: PaillierCipher): PaillierCipher {
    // We need to compute modular inverse of other.c
    // This is a simplified version - in practice needs proper mod inverse
    return new PaillierCipher({ 
      c: Circuit.if(other.c.equals(Field(0)),
        this.c,
        this.c.div(other.c)
      )
    });
  }
}

export class Paillier {
    public n: Field;         // modulus (n = p * q)
    public g: Field;         // generator (often chosen as n+1)
    public lambda: Field;    // lcm(p-1, q-1)
    public mu: Field;        // (L(g^lambda mod n^2))^-1 mod n

    constructor(n: Field, g: Field, lambda: Field, mu: Field) {
        this.n = n;
        this.g = g;
        this.lambda = lambda;
        this.mu = mu;
    }

    /**
     * Generates a key pair using o1js Field elements
     */
    static generateKeys(): Paillier {
        // For demonstration - in practice use secure prime generation
        const n = Field(143); // Example small numbers
        const g = n.add(1);   // Common choice for g is n + 1
        const lambda = Field(60); // lcm(10,12) for p=11, q=13
        
        // Compute mu using modular arithmetic
        // This is simplified - needs proper L function implementation
        const mu = Field(1); // Placeholder
        
        return new Paillier(n, g, lambda, mu);
    }

    /**
     * Encrypts a message m using o1js Field operations
     */
    static encrypt(m: Field, publicKey: Paillier, r?: Field): PaillierCipher {
        // If no random r provided, generate one
        const randomness = r || Experimental.memoizeWitness(Field, Field.random);
        
        // c = g^m * r^n mod n^2
        // Note: This is simplified - needs proper modular exponentiation
        const c = Circuit.if(
          m.equals(Field(0)),
          Field(1),
          publicKey.g.mul(randomness.mul(publicKey.n))
        );

        return new PaillierCipher({ c });
    }

    /**
     * Decrypts a ciphertext using o1js Field operations
     */
    static decrypt(cipher: PaillierCipher, privateKey: Paillier): Field {
        // m = L(c^lambda mod n^2) * mu mod n
        // Note: This is simplified - needs proper L function and modular arithmetic
        const m = cipher.c.mul(privateKey.lambda).mul(privateKey.mu);
        
        return m;
    }
}

//EXAMPLE 

//const cDiff = Paillier.subtract(encryptedCorrect, encryptedUser, publicKey);

//const decryptedDiff = Paillier.decrypt(cDiff, privateKey);

//console.log(decryptedDiff);

