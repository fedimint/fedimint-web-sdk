const { FedimintWallet } = require("@fedimint/core-web");

const wallet = new FedimintWallet();

wallet.setLogLevel("debug");
wallet.open();

module.exports = { wallet };
