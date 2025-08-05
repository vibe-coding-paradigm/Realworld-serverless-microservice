#!/bin/bash

echo "🚀 Starting Article Primary Key migration..."

REGION="ap-northeast-2"
TABLE_NAME="conduit-articles"

# Get all articles
echo "📊 Scanning table: $TABLE_NAME"
ARTICLES=$(aws dynamodb scan \
  --table-name "$TABLE_NAME" \
  --filter-expression "SK = :sk" \
  --expression-attribute-values '{":sk":{"S":"METADATA"}}' \
  --region "$REGION" \
  --output json)

if [ $? -ne 0 ]; then
  echo "❌ Failed to scan table"
  exit 1
fi

ARTICLE_COUNT=$(echo "$ARTICLES" | jq '.Items | length')
echo "📦 Found $ARTICLE_COUNT articles to migrate"

MIGRATED=0
SKIPPED=0

for i in $(seq 0 $((ARTICLE_COUNT - 1))); do
  ITEM=$(echo "$ARTICLES" | jq ".Items[$i]")
  
  ARTICLE_ID=$(echo "$ITEM" | jq -r '.article_id.S // empty')
  SLUG=$(echo "$ITEM" | jq -r '.slug.S // empty')
  CURRENT_PK=$(echo "$ITEM" | jq -r '.PK.S // empty')
  
  if [[ -z "$ARTICLE_ID" || -z "$SLUG" ]]; then
    echo "⚠️  Skipping item without article_id or slug"
    ((SKIPPED++))
    continue
  fi
  
  EXPECTED_NEW_PK="ARTICLE#$SLUG"
  
  # Check if already migrated
  if [[ "$CURRENT_PK" == "$EXPECTED_NEW_PK" ]]; then
    echo "✅ Article already migrated: $SLUG"
    ((SKIPPED++))
    continue
  fi
  
  echo "🔄 Migrating: $CURRENT_PK → $EXPECTED_NEW_PK"
  
  # Create new item with slug-based PK
  NEW_ITEM=$(echo "$ITEM" | jq ".PK.S = \"$EXPECTED_NEW_PK\"")
  
  # Put new item
  aws dynamodb put-item \
    --table-name "$TABLE_NAME" \
    --item "$NEW_ITEM" \
    --condition-expression "attribute_not_exists(PK)" \
    --region "$REGION" > /dev/null 2>&1
  
  if [ $? -eq 0 ]; then
    echo "✅ Created new item: $EXPECTED_NEW_PK"
    
    # Delete old item
    aws dynamodb delete-item \
      --table-name "$TABLE_NAME" \
      --key "{\"PK\":{\"S\":\"$CURRENT_PK\"},\"SK\":{\"S\":\"METADATA\"}}" \
      --region "$REGION" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
      echo "🗑️  Deleted old item: $CURRENT_PK"
      ((MIGRATED++))
    else
      echo "❌ Failed to delete old item: $CURRENT_PK"
    fi
  else
    echo "⚠️  Item already exists or failed to create: $EXPECTED_NEW_PK"
    ((SKIPPED++))
  fi
done

echo ""
echo "🎉 Migration completed!"
echo "✅ Migrated: $MIGRATED articles"
echo "⏭️  Skipped: $SKIPPED articles"
echo "📊 Total processed: $ARTICLE_COUNT"

# Verify migration
echo ""
echo "🔍 Verifying migration..."
MIGRATED_ARTICLES=$(aws dynamodb scan \
  --table-name "$TABLE_NAME" \
  --filter-expression "SK = :sk AND begins_with(PK, :pk_prefix)" \
  --expression-attribute-values '{":sk":{"S":"METADATA"},":pk_prefix":{"S":"ARTICLE#test-article-"}}' \
  --region "$REGION" \
  --output json)

MIGRATED_COUNT=$(echo "$MIGRATED_ARTICLES" | jq '.Items | length')
echo "✅ Verification: Found $MIGRATED_COUNT articles with new PK format"

echo "🚀 Migration completed successfully!"