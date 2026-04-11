const { BlobServiceClient } = require('@azure/storage-blob');
try {
  // Simulate string containing literal double quotes that Azure ENV variables sometimes inject
  const connectionString = '"DefaultEndpointsProtocol=https;EndpointSuffix=core.windows.net;AccountName=test;AccountKey=123;BlobEndpoint=https://test.blob.core.windows.net/"';
  BlobServiceClient.fromConnectionString(connectionString);
  console.log('Success!');
} catch (e) {
  console.error('ERROR:', e.message, e.code);
}
