const { BlobServiceClient } = require('@azure/storage-blob');
try {
  BlobServiceClient.fromConnectionString('');
  console.log('Success!');
} catch (e) {
  console.error('ERROR:', e.message, e.code);
}
