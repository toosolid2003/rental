#!/bin/bash

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to cleanup background processes on exit
cleanup() {
    echo -e "\n${RED}Shutting down...${NC}"
    if [ ! -z "$HARDHAT_PID" ]; then
        echo "Stopping Hardhat node (PID: $HARDHAT_PID)..."
        kill $HARDHAT_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        echo "Stopping frontend dev server (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    exit 0
}

# Set up trap to catch SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

echo -e "${BLUE}=== Step 1: Compiling contracts ===${NC}"
npx hardhat compile

echo -e "\n${BLUE}=== Step 2: Copying Rental.json to frontend ===${NC}"
cp artifacts/contracts/rental.sol/Rental.json rental-frontend/src/lib/Rental.json
echo -e "${GREEN}✓ Rental.json copied successfully${NC}"

echo -e "\n${BLUE}=== Step 3: Starting Hardhat node ===${NC}"
npx hardhat node > /tmp/hardhat-node.log 2>&1 &
HARDHAT_PID=$!
echo -e "${GREEN}✓ Hardhat node started (PID: $HARDHAT_PID)${NC}"
echo "Waiting for Hardhat node to be ready..."
sleep 5

echo -e "\n${BLUE}=== Step 4: Deploying contract using LocalRentalScoreModule ===${NC}"
npx hardhat ignition deploy ignition/modules/LocalRentalScoreModule.ts --network localhost

echo -e "\n${BLUE}=== Step 5: Starting frontend dev server ===${NC}"
cd rental-frontend
npm run dev > /tmp/frontend-dev.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo -e "${GREEN}✓ Frontend dev server started (PID: $FRONTEND_PID)${NC}"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}All services are running!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Hardhat node: http://localhost:8545"
echo -e "Frontend dev server: http://localhost:3000"
echo -e "\nLogs:"
echo -e "  Hardhat node: tail -f /tmp/hardhat-node.log"
echo -e "  Frontend: tail -f /tmp/frontend-dev.log"
echo -e "\nPress Ctrl+C to stop all services"
echo -e "${GREEN}========================================${NC}\n"

# Wait indefinitely (until Ctrl+C)
wait
