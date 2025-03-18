import { FedimintClient } from '@fedimint/core-web';

let client: FedimintClient | null = null;

// Helper function to update results
const updateResults = (message: string) => {
    const resultsElement = document.getElementById('results');
    if (resultsElement) {
        resultsElement.textContent = message;
    }
};

// Connect to Fedimint
async function connectToFedimint() {
    try {
        client = await FedimintClient.connect('ws://localhost:3333');
        updateResults('Successfully connected to Fedimint!');
    } catch (error) {
        updateResults(`Error connecting to Fedimint: ${error}`);
    }
}

// Get balance
async function getBalance() {
    if (!client) {
        updateResults('Please connect to Fedimint first');
        return;
    }

    try {
        const balance = await client.getBalance();
        updateResults(`Current balance: ${balance} sats`);
    } catch (error) {
        updateResults(`Error getting balance: ${error}`);
    }
}

// Add event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const connectButton = document.getElementById('connectButton');
    const getBalanceButton = document.getElementById('getBalanceButton');

    if (connectButton) {
        connectButton.addEventListener('click', connectToFedimint);
    }

    if (getBalanceButton) {
        getBalanceButton.addEventListener('click', getBalance);
    }
}); 