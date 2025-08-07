#!/bin/bash

# Deploy Betley to Base Sepolia Testnet
# Make sure you have:
# 1. PRIVATE_KEY set in contracts/.env
# 2. Base Sepolia ETH in your wallet for gas fees

echo "🚀 Deploying Betley to Base Sepolia Testnet..."
echo "Chain ID: 84532"
echo "RPC: https://base-sepolia.api.onfinality.io/public"
echo ""

# Check if .env file exists
if [ ! -f "contracts/.env" ]; then
    echo "❌ Error: contracts/.env file not found!"
    echo "Please create contracts/.env with your PRIVATE_KEY"
    exit 1
fi

# Change to contracts directory
cd contracts

# Build contracts
echo "📦 Building contracts..."
forge build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Deploy to Base Sepolia
echo "🚀 Deploying to Base Sepolia..."
forge script script/DeployBetleyBaseSepolia.s.sol:DeployBetleyBaseSepoliaScript \
    --rpc-url base_sepolia \
    --broadcast \
    --verify \
    -vvvv

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Copy the contract address from the output above"
    echo "2. Update frontend/.env.local with NEXT_PUBLIC_BETLEY_ADDRESS=<contract_address>"
    echo "3. Test the frontend with the new contract"
    echo "4. Get Base Sepolia ETH from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet"
    echo ""
    echo "🔗 Useful links:"
    echo "- Base Sepolia Explorer: https://sepolia.basescan.org"
    echo "- Base Sepolia Faucet: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet"
    echo "- Base Docs: https://docs.base.org"
else
    echo "❌ Deployment failed!"
    echo "Check the error messages above and ensure:"
    echo "1. Your private key is correct in contracts/.env"
    echo "2. You have Base Sepolia ETH for gas fees"
    echo "3. The RPC endpoint is accessible"
fi