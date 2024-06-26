import { FedimintWallet } from "../lib/index"; // "fedimint-client-ts";

console.log("fedimint-client-ts", FedimintWallet);

const $ = document.querySelector.bind(document);

// Joining a federation

//
const inviteCode =
  "fed11qgqrgvnhwden5te0v9k8q6rp9ekh2arfdeukuet595cr2ttpd3jhq6rzve6zuer9wchxvetyd938gcewvdhk6tcqqysptkuvknc7erjgf4em3zfh90kffqf9srujn6q53d6r056e4apze5cw27h75";

let fed: FedimintWallet;
FedimintWallet.initFedimint()
  .then(() => {
    console.log("init Fedimint worked!!!!", inviteCode);
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
  const balance = $(".balance");
  if (!balance) return;
  const bal: number = await fed.getBalance();
  console.log("balance", bal);
  balance.innerText = (bal / 1000).toString();
  return balance.innerText;
}
// @ts-ignore
window.refetch = refreshBalance;

$(".ecash-submit")?.addEventListener("click", async (event) => {
  event.preventDefault();
  const ecash: string = $(".ecash-input")?.value;
  if (!ecash) return;
  console.log("ecash note", ecash);
  const res = await fed.reissueNotes(ecash);
  console.log("redeemed ecash", res);
  await refreshBalance();
});

$(".lightning-submit")?.addEventListener("click", async (event) => {
  event.preventDefault();
  const invoice: string = $(".lightning-input")?.value;
  if (!invoice) return;
  console.log("lightning invoice", invoice);
  const res = await fed.payInvoice(invoice);
  console.log("paid lightning invoice", res);
  await refreshBalance();
});

$(".refresh-balance")?.addEventListener("click", async (event) => {
  event.preventDefault();
  await refreshBalance();
});

/** --- FORM --- */

/** --- QR --- */
