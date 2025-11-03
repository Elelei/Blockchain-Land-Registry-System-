#!/bin/bash

echo "🚀 Setting up Land Registry Project..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install contract dependencies
echo "📦 Installing contract dependencies..."
cd contracts
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start local blockchain: cd contracts && npx hardhat node"
echo "2. Deploy contracts: cd contracts && npx hardhat run scripts/deploy.js --network localhost"
echo "3. Start frontend: cd frontend && npm run dev"
