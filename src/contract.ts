import {
  Field,
  state,
  State,
  method,
  SmartContract,
  DeployArgs,
  Reducer,
  Permissions,
  Struct,
  PublicKey,
  UInt8,
  Gadgets,
  Bool,
  Circuit,
  Provable
} from "o1js";
import { Cipher, ElGamalFF } from "./elgamal";
import { decrypt, encrypt } from "./he";
export const MAX_USERS = 6;

export class SecureMultiplication extends SmartContract {
  @state(Cipher) encryptedFullScore = State<Cipher>();
  @state(Cipher) encryptedCorrectAnswers = State<Cipher>();
  @state(Cipher) encryptedUserAnswers = State<Cipher>();
  @state(Field) pk = State<Field>();
  @state(Field) encryptedScore = State<Field>();
  events = {
    passed: Bool,
  };

  @method async setEncryptedFullScore(encryptedValue: Cipher) {
    this.encryptedFullScore.set(encryptedValue);
  }

  @method async setEncryptedCorrectAnswers(encryptedValue: Cipher) {
    this.encryptedCorrectAnswers.set(encryptedValue);
  }

  @method async setEncryptedUserAnswers(encryptedValue: Cipher) {
    this.encryptedUserAnswers.set(encryptedValue);
  }

  async countSetBitsBigInt(v: Field) {
    const fieldV = v;
    const v1 = v.sub(Gadgets.and(Gadgets.rightShift64(fieldV, 1), Field(0x5555555555555555n), 64));
    const v2 = Gadgets.and(v1, Field(0x3333333333333333n), 64).add(Gadgets.and(Gadgets.rightShift64(v1, 2), Field(0x3333333333333333n), 64));
    const v3 = Gadgets.and(v2.add(Gadgets.rightShift64(v2, 4)), Field(0x0F0F0F0F0F0F0F0Fn), 64);
    const v5 = v3.add(Gadgets.rightShift64(v3, 8));
    const v6 = v5.add(Gadgets.rightShift64(v5, 16));
    const v7 = v6.add(Gadgets.rightShift64(v6, 32));
    return Gadgets.and(v7, Field(0x7Fn), 64);
  }

  @method calculateScore() {
    // Get the encrypted answers
    const encryptedUserAnswers = this.encryptedUserAnswers.get();
    const encryptedCorrectAnswers = this.encryptedCorrectAnswers.get();
    this.encryptedUserAnswers.assertEquals(encryptedUserAnswers);
    this.encryptedCorrectAnswers.assertEquals(encryptedCorrectAnswers);

    // Extract the encrypted values for comparison
    const userScore = encryptedUserAnswers.c2;
    const totalQuestions = encryptedCorrectAnswers.c2;
    
    // Store the user's score
    this.encryptedScore.set(userScore);
    
    // Compare with passing threshold (4 out of 6)
    // Since we're working with encrypted values, we need to check if score >= 4
    const threshold = Field(4);
    
    // Check if score is greater than or equal to threshold
    const isEqual = userScore.equals(threshold);
    const isGreater = userScore.equals(Field(5)).or(userScore.equals(Field(6)));
    const passed = isEqual.or(isGreater);
    
    this.emitEvent('passed', passed);
  }

  deploy(args: DeployArgs) {
    super.deploy(args);
    this.encryptedScore.set(Field(0));
  }
}
