import {
  Cloud,
  fee,
  initBlockchain,
  accountBalanceMina,
  sleep,
} from "zkcloudworker";
import { SecureMultiplication } from "./src/contract";
import { PublicKey, Mina, fetchAccount, Field } from "o1js";

export async function compile(cloud: Cloud, args: string[]) {
  console.log("he: compile 8");
  await cloud.log("he: compile 8 (cloud log)");
  const deployer = await cloud.getDeployer();
  console.log("deployer", deployer.toBase58());

  console.time("compiled");

  const vk = (
    await SecureMultiplication.compile({ cache: cloud.cache })
  ).verificationKey.hash.toJSON();
  console.timeEnd("compiled");
  console.log("vk", vk);
  return vk;
}
async function fetchMinaAccount(args: { publicKey: PublicKey }): Promise<void> {
  const timeout = 1000 * 60 * 3; // 3 minutes
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      const result = await fetchAccount({
        publicKey: args.publicKey.toBase58(),
      });
      if (result.account !== undefined) return;
      console.error("Cannot fetch account", args.publicKey.toBase58(), result);
    } catch (error) {
      console.error("Error in fetchMinaAccount:", error);
    }
    await sleep(1000 * 30);
  }
  console.error("Timeout in fetchMinaAccount");
}
