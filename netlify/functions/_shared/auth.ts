import { adminAuth } from '../../../src/lib/firebase-admin.ts';

export async function getOptionalUserUid(req: Request): Promise<string | undefined> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return undefined;
  }

  const token = authHeader.slice('Bearer '.length);
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    return undefined;
  }
}
