import { BlobServiceClient } from '@azure/storage-blob';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const containerName = 'employee-docs';

let _blobService: BlobServiceClient | null = null;

function getBlobService() {
  if (!_blobService) {
    _blobService = BlobServiceClient.fromConnectionString(connectionString);
  }
  return _blobService;
}

export async function uploadBlob(fileName: string, buffer: Buffer, contentType: string): Promise<string> {
  const blobService = getBlobService();
  const containerClient = blobService.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);

  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: contentType }
  });

  return blockBlobClient.url;
}

export async function deleteBlob(fileName: string): Promise<void> {
  const blobService = getBlobService();
  const containerClient = blobService.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);
  await blockBlobClient.deleteIfExists();
}

export async function getBlobSasUrl(fileName: string): Promise<string> {
  const blobService = getBlobService();
  const containerClient = blobService.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);

  // Generate a SAS URL valid for 1 hour
  const { generateBlobSASQueryParameters, BlobSASPermissions, StorageSharedKeyCredential } = await import('@azure/storage-blob');
  
  const accountName = connectionString.match(/AccountName=([^;]+)/)?.[1] || '';
  const accountKey = connectionString.match(/AccountKey=([^;]+)/)?.[1] || '';
  const sharedKey = new StorageSharedKeyCredential(accountName, accountKey);

  const sasToken = generateBlobSASQueryParameters({
    containerName,
    blobName: fileName,
    permissions: BlobSASPermissions.parse('r'),
    startsOn: new Date(),
    expiresOn: new Date(Date.now() + 60 * 60 * 1000),
  }, sharedKey).toString();

  return `${blockBlobClient.url}?${sasToken}`;
}
