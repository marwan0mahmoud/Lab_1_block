"use strict";

function encrypt(message, pubKey) {
  let m = BigInt(message);
  let e = BigInt(pubKey.e);
  let n = BigInt(pubKey.modulus);
  return (m ** e) % n;
}

function decrypt(ciphertext, privKey) {
  let c = BigInt(ciphertext);
  let d = BigInt(privKey.d);
  let n = BigInt(privKey.modulus);
  return (c ** d) % n;
}

function sign(message, privKey) {
  return decrypt(message, privKey);
}

function verify(message, sig, pubKey) {
  let m = encrypt(sig, pubKey);
  return m === BigInt(message);
}

let mod = 33n;
let pub = { modulus: mod, e: 3n };
let priv = { modulus: mod, d: 7n };

let m = 18n;
let c = encrypt(m, pub);
console.log(`${m} encrypted returns ${c}`);
let m1 = decrypt(c, priv);
console.log(`${c} decrypted returns ${m1}`);
console.log();

m = 24n;
let sig = sign(m, priv);
console.log(`${m} signed returns signature ${sig}`);
let b = verify(m, sig, pub);
console.log(`${sig} ${b ? "is" : "is not"} a valid signature for ${m}`);
