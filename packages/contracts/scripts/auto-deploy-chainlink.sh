#!/bin/bash

# Auto-deployment script for ChainlinkPriceOracle
# Will attempt deployment with retries when Sepolia network is available

MAX_RETRIES=5
RETRY_DELAY=30
LOG_FILE="deployment.log"

echo "=== ChainlinkPriceOracle Auto-Deployment Script ===" | tee -a $LOG_FILE
echo "Started at: $(date)" | tee -a $LOG_FILE
echo "Max retries: $MAX_RETRIES" | tee -a $LOG_FILE
echo "Retry delay: ${RETRY_DELAY}s" | tee -a $LOG_FILE
echo "" | tee -a $LOG_FILE

for i in $(seq 1 $MAX_RETRIES); do
    echo "Attempt $i of $MAX_RETRIES..." | tee -a $LOG_FILE
    
    # Try deployment
    if npm run deploy:chainlink 2>&1 | tee -a $LOG_FILE; then
        echo "" | tee -a $LOG_FILE
        echo "✅ Deployment successful!" | tee -a $LOG_FILE
        echo "Completed at: $(date)" | tee -a $LOG_FILE
        
        # Extract and display contract address
        echo "" | tee -a $LOG_FILE
        echo "📝 Next Steps:" | tee -a $LOG_FILE
        echo "1. Copy the ChainlinkPriceOracle address from above" | tee -a $LOG_FILE
        echo "2. Update packages/frontend/.env.local" | tee -a $LOG_FILE
        echo "3. Update scripts/deploy.ts to use Chainlink oracle" | tee -a $LOG_FILE
        echo "4. Redeploy PositionManager: npm run deploy:sepolia" | tee -a $LOG_FILE
        
        exit 0
    fi
    
    echo "❌ Attempt $i failed" | tee -a $LOG_FILE
    
    if [ $i -lt $MAX_RETRIES ]; then
        echo "Retrying in ${RETRY_DELAY}s..." | tee -a $LOG_FILE
        sleep $RETRY_DELAY
    fi
done

echo "" | tee -a $LOG_FILE
echo "❌ All deployment attempts failed" | tee -a $LOG_FILE
echo "Please check:" | tee -a $LOG_FILE
echo "  - Sepolia RPC connectivity" | tee -a $LOG_FILE
echo "  - PRIVATE_KEY in .env" | tee -a $LOG_FILE
echo "  - Sufficient Sepolia ETH balance" | tee -a $LOG_FILE
echo "" | tee -a $LOG_FILE
echo "Failed at: $(date)" | tee -a $LOG_FILE

exit 1
