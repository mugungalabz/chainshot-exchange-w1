import "./index.scss";

const server = "http://localhost:3042";
let privateKey;
document.getElementById("exchange-address").addEventListener('input', ({ target: {value} }) => {
  if (value === "") {
    document.getElementById("balance").innerHTML = 0;
    return;
  }

  fetch(`${server}/balance/${value}`).then((response) => {
    return response.json();
  }).then(({ balance, pkey }) => {
    privateKey = pkey;//
    console.log({privateKey:privateKey})
    document.getElementById("balance").innerHTML = balance;
  });
});

document.getElementById("transfer-amount").addEventListener('click', () => {
  const EC = require('elliptic').ec;
  const ec = new EC('secp256k1');
  const SHA256 = require('crypto-js/sha256');
  const sender = document.getElementById("exchange-address").value;
  const amount = document.getElementById("send-amount").value;
  const recipient = document.getElementById("recipient").value;
  const key = ec.keyFromPrivate(privateKey);
  const txmsg = sender + "" + amount + "" + recipient;
  const msgHash = SHA256(txmsg);
  const signature = key.sign(msgHash.toString());
  const body = JSON.stringify({
    sender, amount, recipient, signature
  });

  const request = new Request(`${server}/send`, { method: 'POST', body });

  fetch(request, { headers: { 'Content-Type': 'application/json' }}).then(response => {
    return response.json();
  }).then(({ balance }) => {
    document.getElementById("balance").innerHTML = balance;
  });
});
