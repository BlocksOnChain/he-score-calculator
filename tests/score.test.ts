import { describe, expect, it, beforeAll } from "@jest/globals";
import { Field, Mina, PrivateKey, PublicKey, AccountUpdate, Bool } from "o1js";
import { SecureMultiplication } from "../src/contract";
import { encrypt, generateKeys } from "../src/he";
import { Cipher } from "../src/elgamal";

describe("Score Calculation", () => {
  let pk: Field;
  let sk: Field;
  const Local = Mina.LocalBlockchain({ proofsEnabled: false });
  Mina.setActiveInstance(Local);
  
  const deployer = Local.testAccounts[0].privateKey;
  const deployerAddress = deployer.toPublicKey();
  
  const privateKey = PrivateKey.random();
  const publicKey = privateKey.toPublicKey();
  const zkApp = new SecureMultiplication(publicKey);

  beforeAll(async () => {
    await SecureMultiplication.compile();
    const keys = generateKeys();
    pk = keys.pk;
    sk = keys.sk;
  });

  it("should deploy the contract", async () => {
    const tx = await Mina.transaction(deployerAddress, () => {
      AccountUpdate.fundNewAccount(deployerAddress);
      zkApp.deploy({});
      zkApp.pk.set(pk);
    });
    await tx.prove();
    await tx.sign([deployer, privateKey]).send();
  });

  it("should calculate score correctly using homomorphic encryption", async () => {
    // Test case 1: User gets 4 correct answers (should pass)
    const userAnswers = Field(4); // 4 correct answers
    const correctAnswers = Field(6); // Total 6 questions
    
    // Encrypt the values
    const encryptedUserAnswers = new Cipher({
      c1: Field(0), // We only need c2 for comparison
      c2: userAnswers
    });
    const encryptedCorrectAnswers = new Cipher({
      c1: Field(0), // We only need c2 for comparison
      c2: correctAnswers
    });
    
    // Set encrypted values
    const tx1 = await Mina.transaction(deployerAddress, () => {
      zkApp.setEncryptedUserAnswers(encryptedUserAnswers);
      zkApp.setEncryptedCorrectAnswers(encryptedCorrectAnswers);
    });
    await tx1.prove();
    await tx1.sign([deployer, privateKey]).send();
    
    // Calculate score
    const tx2 = await Mina.transaction(deployerAddress, () => {
      zkApp.calculateScore();
    });
    await tx2.prove();
    const txn2 = await tx2.sign([deployer, privateKey]).send();
    
    // Get events from the transaction
    const events = await zkApp.fetchEvents();
    const passedEvent = events[events.length - 1];
    expect(passedEvent.type).toBe('passed');
    expect(passedEvent.event.data.toString()).toBe(Bool(true).toString());

    // Test case 2: User gets 3 correct answers (should fail)
    const userAnswers2 = Field(3); // 3 correct answers
    const encryptedUserAnswers2 = new Cipher({
      c1: Field(0), // We only need c2 for comparison
      c2: userAnswers2
    });
    
    const tx3 = await Mina.transaction(deployerAddress, () => {
      zkApp.setEncryptedUserAnswers(encryptedUserAnswers2);
    });
    await tx3.prove();
    await tx3.sign([deployer, privateKey]).send();
    
    const tx4 = await Mina.transaction(deployerAddress, () => {
      zkApp.calculateScore();
    });
    await tx4.prove();
    const txn4 = await tx4.sign([deployer, privateKey]).send();
    
    // Get events from the transaction
    const events2 = await zkApp.fetchEvents();
    const passedEvent2 = events2[events2.length - 1];
    expect(passedEvent2.type).toBe('passed');
    expect(passedEvent2.event.data.toString()).toBe(Bool(false).toString());
  });
}); 