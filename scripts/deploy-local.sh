#!/bin/bash

echo "🔧 Deploying contracts to local network..."

cd contracts

# Check if hardhat node is running
if ! nc -z localhost 8545 2>/dev/null; then
    echo "❌ Hardhat node is not running!"
    echo "Please start it with: npx hardhat node"
    exit 1
fi

# Compile contracts
echo "📝 Compiling contracts..."
npx hardhat compile

# Deploy contracts
echo "🚀 Deploying contracts..."
npx hardhat run scripts/deploy.js --network localhost

echo "✅ Deployment complete!"
echo "Contract address saved to frontend/src/config/contract-address.json"
