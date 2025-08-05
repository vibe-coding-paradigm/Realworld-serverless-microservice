const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({ region: 'ap-northeast-2' });
const dynamodb = new AWS.DynamoDB();

const TABLE_NAME = 'conduit-articles';

async function migrateArticleKeys() {
  console.log('🚀 Starting Article Primary Key migration...');
  console.log(`📊 Scanning table: ${TABLE_NAME}`);
  
  try {
    // Scan all articles
    const scanParams = {
      TableName: TABLE_NAME,
      FilterExpression: 'SK = :sk',
      ExpressionAttributeValues: {
        ':sk': { S: 'METADATA' }
      }
    };
    
    const result = await dynamodb.scan(scanParams).promise();
    console.log(`📦 Found ${result.Items.length} articles to migrate`);
    
    let migrated = 0;
    let skipped = 0;
    
    for (const item of result.Items) {
      const articleId = item.article_id?.S;
      const slug = item.slug?.S;
      const currentPK = item.PK?.S;
      
      if (!articleId || !slug) {
        console.log(`⚠️  Skipping item without article_id or slug: ${JSON.stringify(item)}`);
        skipped++;
        continue;
      }
      
      const expectedNewPK = `ARTICLE#${slug}`;
      
      // Check if already migrated
      if (currentPK === expectedNewPK) {
        console.log(`✅ Article already migrated: ${slug}`);
        skipped++;
        continue;
      }
      
      console.log(`🔄 Migrating: ${currentPK} → ${expectedNewPK}`);
      
      // Step 1: Create new item with slug-based PK
      const newItem = { ...item };
      newItem.PK = { S: expectedNewPK };
      
      const putParams = {
        TableName: TABLE_NAME,
        Item: newItem,
        ConditionExpression: 'attribute_not_exists(PK)' // Prevent overwriting
      };
      
      try {
        await dynamodb.putItem(putParams).promise();
        console.log(`✅ Created new item: ${expectedNewPK}`);
        
        // Step 2: Delete old item
        const deleteParams = {
          TableName: TABLE_NAME,
          Key: {
            PK: { S: currentPK },
            SK: { S: 'METADATA' }
          }
        };
        
        await dynamodb.deleteItem(deleteParams).promise();
        console.log(`🗑️  Deleted old item: ${currentPK}`);
        
        migrated++;
      } catch (error) {
        if (error.code === 'ConditionalCheckFailedException') {
          console.log(`⚠️  Item already exists: ${expectedNewPK}`);
          skipped++;
        } else {
          console.error(`❌ Failed to migrate ${slug}:`, error);
        }
      }
    }
    
    console.log(`\n🎉 Migration completed!`);
    console.log(`✅ Migrated: ${migrated} articles`);
    console.log(`⏭️  Skipped: ${skipped} articles`);
    console.log(`📊 Total processed: ${result.Items.length}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Also migrate comments if needed
async function migrateComments() {
  console.log('\n🔄 Checking comments table for consistency...');
  
  try {
    const scanParams = {
      TableName: 'conduit-comments',
      Limit: 5
    };
    
    const result = await dynamodb.scan(scanParams).promise();
    console.log(`📦 Found ${result.Items.length} comment items`);
    
    for (const item of result.Items) {
      console.log(`💬 Comment PK: ${item.PK?.S}, SK: ${item.SK?.S}`);
    }
    
    console.log('✅ Comments table check completed');
    
  } catch (error) {
    console.error('❌ Comments check failed:', error);
  }
}

// Run migration
async function main() {
  await migrateArticleKeys();
  await migrateComments();
  console.log('\n🚀 All migrations completed!');
}

main().catch(console.error);