import { FedimintWallet } from "../lib/index"; // "fedimint-client-ts";

console.log("fedimint-client-ts", FedimintWallet);

// local federation
const inviteCode =
  "fed11qgqzutrhwden5te0vejkg6tdd9h8gepwvejkg6tdd9h8gtn0v35kuen9v3jhyct5d9hkutnc09az7qqpyp938g2xae96wv4jhzg55u4q5tjcw037jsk6948walv95hlyrunm5tyfcdy";

let fed: FedimintWallet;
FedimintWallet.initFedimint()
  .then(() => {
    console.log("init Fedimint worked!!!!");
    return FedimintWallet.joinFederation(inviteCode);
  })
  .then((res) => {
    console.log("joined Federation!!!!", res);
    fed = res;
    // @ts-ignore
    window.fed = fed;
  });

/** refetch balance */

async function refreshBalance() {
  const balance = document.getElementById("balance");
  if (!balance) return;
  const bal: number = await fed.getBalance();
  console.log("balance", bal);
  balance.innerText = (bal / 1000).toString();
}
// @ts-ignore
window.refetch = refreshBalance;

/** --- Ecash form --- */
const ecashForm = () => {
  const form = document.querySelector(
    "body > main > div:nth-child(1) > form"
  ) as HTMLFormElement;
  const input = document.querySelector(
    "body > main > div:nth-child(1) > form > div > input"
  );
  if (!form || !input) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    console.log(input);
    console.log(Object.keys(event), event.isTrusted, event);
  });
};
ecashForm();

/** --- FORM --- */

/** --- QR --- */
