"use strict";
// required npm install blind-signatures chalk
const blindSignatures = require("blind-signatures");
const chalk = require("chalk");

const { Coin, COIN_RIS_LENGTH, IDENT_STR, BANK_STR } = require("./coin.js");
const utils = require("./utils.js");

// Bank's key details
const BANK_KEY = blindSignatures.keyGeneration({ b: 2048 });
const N = BANK_KEY.keyPair.n.toString();
const E = BANK_KEY.keyPair.e.toString();

function signCoin(blindedCoinHash) {
  return blindSignatures.sign({ blinded: blindedCoinHash, key: BANK_KEY });
}

function parseCoin(s) {
  let [cnst, amt, guid, leftHashes, rightHashes] = s.split("-");
  if (cnst !== BANK_STR) {
    throw new Error(
      chalk.red(`Invalid identity string: ${cnst} received, but ${BANK_STR} expected`)
    );
  }
  let lh = leftHashes.split(",");
  let rh = rightHashes.split(",");
  return [lh, rh];
}

function acceptCoin(coin) {
  const isValid = blindSignatures.verify({
    unblinded: coin.signature,
    N: N,
    E: E,
    message: coin.toString()
  });

  if (!isValid) {
    throw new Error(chalk.red("❌ Invalid coin signature"));
  }

  const isLeft = Math.random() < 0.5;
  const ris = [];
  for (let i = 0; i < COIN_RIS_LENGTH; i++) {
    ris.push(coin.getRis(isLeft, i));
  }
  return ris;
}

function determineCheater(guid, ris1, ris2) {
  console.log(chalk.yellow.bold("\n=== Double-Spending Detection Results ==="));
  console.log(chalk.cyan(`Coin ID: ${guid}`));
  console.log(chalk.gray("----------------------------------------"));

  if (JSON.stringify(ris1) === JSON.stringify(ris2)) {
    console.log(chalk.red("🚫 ALERT: Merchant Cheating Detected!"));
    console.log(chalk.red("Reason: Both RIS strings are identical"));
    console.log(chalk.gray("----------------------------------------"));
    return;
  }

  for (let i = 0; i < COIN_RIS_LENGTH; i++) {
    const xorResult = utils.decryptOTP({
      key: ris1[i],
      ciphertext: ris2[i],
      returnType: "string"
    });

    if (xorResult.startsWith(IDENT_STR)) {
      const cheaterId = xorResult.split(":"[1]);
      console.log(chalk.red("🚫 ALERT: Double-Spending Detected!"));
      console.log(chalk.bgRed.white(`Cheater Identity: ${cheaterId}`));
      console.log(chalk.gray("----------------------------------------"));
      return;
    }
  }
  console.log(chalk.yellow("⚠️ Warning: Unable to determine cheater"));
  console.log(chalk.gray("----------------------------------------"));
}

// Execution
console.log(chalk.green.bold("\n=== Digital Cash System Demo ==="));
console.log("Creating a new coin...");

let coin = new Coin("Ahmed Ashraf", 20, N, E);
console.log(chalk.blue(`✔ Created coin for: Ahmed Ashraf`));
console.log(chalk.blue(`💰 Amount: 20 units`));
console.log(chalk.blue(`🔑 Coin ID: ${coin.guid}`));
console.log(chalk.gray("----------------------------------------"));

console.log(chalk.green.bold("\n=== Bank Operations ==="));
coin.signature = signCoin(coin.blinded);
coin.unblind();
console.log(chalk.green("✓ Coin signed and unblinded successfully"));
console.log(chalk.gray("----------------------------------------"));

console.log(chalk.magenta.bold("\n=== Merchant Transactions ==="));
console.log("Merchant 1 accepting the coin...");
let ris1 = acceptCoin(coin);
console.log(chalk.green("✓ Transaction 1 completed"));

console.log("\nMerchant 2 accepting the same coin...");
let ris2 = acceptCoin(coin);
console.log(chalk.green("✓ Transaction 2 completed"));
console.log(chalk.gray("----------------------------------------"));

determineCheater(coin.guid, ris1, ris2);
console.log(chalk.cyan.bold("\n=== Testing Merchant Cheating Scenario ==="));
determineCheater(coin.guid, ris1, ris1);

console.log(chalk.green.bold("\n=== Demo Complete ==="));
