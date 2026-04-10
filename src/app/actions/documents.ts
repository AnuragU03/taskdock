"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { uploadBlob, deleteBlob, getBlobSasUrl } from "@/lib/blob";

export async function uploadDocument(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as any).id;

  const file = formData.get('file') as File;
  const docType = formData.get('docType') as string;

  if (!file || !docType) throw new Error("File and document type are required");
  if (!['pan', 'aadhaar', 'certificate'].includes(docType)) throw new Error("Invalid document type");

  // Check if document of this type already exists for user
  const existing = await prisma.employeeDocument.findFirst({
    where: { userId, docType }
  });

  // If replacing, delete old blob
  if (existing) {
    await deleteBlob(existing.blobPath);
    await prisma.employeeDocument.delete({ where: { id: existing.id } });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const blobPath = `${userId}/${docType}/${Date.now()}-${file.name}`;
  const blobUrl = await uploadBlob(blobPath, buffer, file.type);

  await prisma.employeeDocument.create({
    data: {
      userId,
      docType,
      fileName: file.name,
      blobUrl,
      blobPath
    }
  });

  revalidatePath('/profile');
  return { success: true };
}

export async function getMyDocuments() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as any).id;

  const docs = await prisma.employeeDocument.findMany({
    where: { userId },
    orderBy: { uploadedAt: 'desc' }
  });

  // Generate fresh SAS URLs for secure access
  const docsWithUrls = await Promise.all(docs.map(async (doc) => ({
    ...doc,
    secureUrl: await getBlobSasUrl(doc.blobPath)
  })));

  return docsWithUrls;
}

export async function getAllDocuments() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  const role = (session.user as any).role;
  if (role !== 'admin' && role !== 'superadmin') throw new Error("Admin access required");

  const docs = await prisma.employeeDocument.findMany({
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { uploadedAt: 'desc' }
  });

  return docs;
}

export async function deleteDocument(docId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as any).id;
  const role = (session.user as any).role;

  const doc = await prisma.employeeDocument.findUnique({ where: { id: docId } });
  if (!doc) throw new Error("Document not found");

  // Only owner or admin can delete
  if (doc.userId !== userId && role !== 'admin' && role !== 'superadmin') {
    throw new Error("Not authorized to delete this document");
  }

  await deleteBlob(doc.blobPath);
  await prisma.employeeDocument.delete({ where: { id: docId } });

  revalidatePath('/profile');
  return { success: true };
}
