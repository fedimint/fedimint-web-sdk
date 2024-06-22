import { FedimintWallet } from "fedimint-client-ts";

// local federation
const inviteCode =
  "fed11qgqpw9thwvaz7te3xgmjuvpwxqhrzw33xqcrzv30qqqjp8ea0nttppayr4x76qvkr6nxefs5vut8e5aurssrmmqgsc6zmmpznec58u";

let fed: FedimintWallet;
FedimintWallet.initFedimint()
  .then(() => FedimintWallet.joinFederation(inviteCode))
  .then((res) => {
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

const setupForm = () => {
  const form = document.querySelector(".input-form") as HTMLFormElement;
  if (!form) return;

  Promise.all([
    customElements.whenDefined("sl-button"),
    customElements.whenDefined("sl-checkbox"),
    customElements.whenDefined("sl-input"),
    customElements.whenDefined("sl-option"),
    customElements.whenDefined("sl-select"),
    customElements.whenDefined("sl-textarea"),
  ]).then(() => {
    const data = new FormData(form);
    form.addEventListener("submit", (event) => {
      console.log(event, data.entries().next());
      event.preventDefault();
      alert("All fields are valid!");
    });
  });
};
setupForm();

/** --- QR --- */
const loadQr = () => {
  const qr = document.querySelector(".qr-code");
  if (!qr) return;
  qr.setAttribute("value", inviteCode);
  const invite = document.querySelector(".federation-invite");
  invite?.setAttribute("value", inviteCode);
};
loadQr();
