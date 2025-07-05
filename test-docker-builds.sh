#!/bin/bash
# =============================================================================
# TEST PM2 ARCHITECTURE BUILD
# =============================================================================
# This script tests the new PM2-based 3-container architecture
# =============================================================================

set -e  # Exit on any error

echo "🐳 Testing PM2 Architecture Build..."
echo "=================================================="

# Track results
successful=0
failed=0
failed_containers=()

# Array of containers to test
declare -A containers=(
    ["backend"]="Dockerfile.backend"
    ["knowledge-integrator"]="Dockerfile.knowledge-integrator"
    ["postgres"]="Dockerfile.postgres"
)

# Test each container build
for container in "${!containers[@]}"; do
    dockerfile=${containers[$container]}
    echo ""
    echo "🔨 Building $container ($dockerfile)..."
    echo "-------------------------------------------"
    
    if docker build -f $dockerfile -t relica-$container-test . > /tmp/docker-build-$container.log 2>&1; then
        echo "✅ $container build SUCCESSFUL!"
        ((successful++))
        
        # Check image size
        size=$(docker images relica-$container-test --format "{{.Size}}")
        echo "   Image size: $size"
    else
        echo "❌ $container build FAILED!"
        echo "   Check /tmp/docker-build-$container.log for details"
        ((failed++))
        failed_containers+=($container)
        
        # Show last 10 lines of error
        echo "   Last error lines:"
        tail -10 /tmp/docker-build-$container.log | sed 's/^/   /'
    fi
done

echo ""
echo "=================================================="
echo "📊 Build Results Summary:"
echo "   ✅ Successful: $successful"
echo "   ❌ Failed: $failed"

if [ $failed -gt 0 ]; then
    echo ""
    echo "Failed containers: ${failed_containers[*]}"
    echo ""
    echo "⚠️  Some builds failed. Please check the logs."
    exit 1
else
    echo ""
    echo "🎉 All PM2 architecture builds completed successfully!"
    echo ""
    echo "✨ Next step: Test docker-compose up"
fi

# Optional: Clean up test images
echo ""
read -p "Clean up test images? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    for container in "${!containers[@]}"; do
        docker rmi relica-$container-test 2>/dev/null || true
    done
    echo "🧹 Test images cleaned up"
fi