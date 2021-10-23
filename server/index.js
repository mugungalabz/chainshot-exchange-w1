//node index to run this one
const express = require('express');
const app = express();
const cors = require('cors');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const SHA256 = require('crypto-js/sha256');
let GOD_ADDRESS = "";
const port = 3042;

// localhost can have cross origin errors
// depending on the browser you use!
app.use(cors());
app.use(express.json());
const balances = {}
for (let i = 0; i < 4; i++) {
  const key = ec.genKeyPair();
  let pubkey = key.getPublic().encode('hex').substring(0,12)
  balances[pubkey] = {
    public: key.getPublic().encode('hex'),
    private: key.getPrivate().toString(16),
    balance: i*10+17
  }
  if (i == 3) {
    GOD_ADDRESS = pubkey
  }
}

app.get('/balance/:address', (req, res) => {
  const { address } = req.params;
  console.log({address: address})
  console.log({ balances: balances })
  let balance = 0
  let pkey = ""
  if (balances[address]) {
    console.log({balance_for_address:balances[address]})
    balance = balances[address]["balance"] || 0;
    pkey = balances[address]["private"];
  }
  res.send({ balance, pkey });
});

app.post('/send', (req, res) => {
  const { sender, recipient, amount, signature } = req.body;
  console.log({sender:sender})
  let publicKey = balances[sender]["public"]
  const key = ec.keyFromPublic(publicKey, 'hex');
  const txmsg = sender + "" + amount + "" + recipient;
  const msgHash = SHA256(txmsg);
  console.log({msgHash:msgHash, signature:signature})
  const verified = key.verify(msgHash, signature)
  console.log({ verification: verified });
  if (!verified) {
    console.log("UNVERIFIED TRANSACTION, SENDERS FUNDS ARE BEING CONFISCATED")
    confiscateFunds(sender)
  } else if (amount > balances[sender]["balance"]) {
    console.log("SENT MORE THAN YOU HAVE, SENDERS FUNDS ARE BEING CONFISCATED")
    confiscateFunds(sender)
  } else {
    balances[sender]["balance"] -= amount;
    balances[recipient]["balance"]  = (balances[recipient]["balance"]  || 0) +amount;
  }
  console.log({new_sender_balance:balances[sender]});
  res.send({ balance: balances[sender]["balance"] });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
  console.log(balances)
});

function confiscateFunds(address) {
   balances[GOD_ADDRESS]["balance"] = (balances[GOD_ADDRESS]["balance"] || 0) + balances[address]["balance"];
   balances[address] = 0;
}