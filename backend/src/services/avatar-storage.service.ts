import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

const PROFILE_PREFIX = 'profile-images/';
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const allowedContentTypes = new Map<string, string>([
  ['image/jpeg', 'jpg'], ['image/png', 'png'], ['image/webp', 'webp'], ['image/gif', 'gif'],
]);

const SUPABASE_CONFIG_PRESENT = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

const getUploadDir = () => {
  const dir = path.join(process.cwd(), 'uploads', PROFILE_PREFIX);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

const BUFFER_PREFIX = '/uploads/profile-images/';

const getConfig = () => {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw { status: 500, message: 'Supabase Storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' };
  return { url, serviceRoleKey };
};

const storageError = async (response: globalThis.Response) => {
  const detail = await response.text();
  return { status: 502, message: `Supabase Storage request failed (${response.status})${detail ? `: ${detail}` : ''}` };
};

const validate = (file: Buffer, contentType: string) => {
  if (!allowedContentTypes.has(contentType)) throw { status: 415, message: 'Only JPEG, PNG, WebP, and GIF images are supported.' };
  if (!file.length) throw { status: 400, message: 'An image file is required.' };
  if (file.length > MAX_AVATAR_BYTES) throw { status: 413, message: 'Profile images must be 5 MB or smaller.' };
};

const uploadLocal = (employeeId: string, file: Buffer, contentType: string): string => {
  const uploadDir = getUploadDir();
  const extension = allowedContentTypes.get(contentType)!;
  const fileName = `${employeeId}-${randomUUID()}.${extension}`;
  const filePath = path.join(uploadDir, fileName);
  fs.writeFileSync(filePath, file);
  return `${BUFFER_PREFIX}${fileName}`;
};

const removeLocal = (publicUrl: string | null | undefined) => {
  if (!publicUrl) return;
  if (!publicUrl.startsWith(BUFFER_PREFIX)) return;
  const fileName = publicUrl.slice(BUFFER_PREFIX.length).split('/').pop() || publicUrl.split('/').pop();
  if (!fileName) return;
  const uploadDir = getUploadDir();
  const filePath = path.join(uploadDir, fileName);
  if (fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch { /* ignore */ }
  }
};

export const avatarStorage = {
  validate,
  async upload(employeeId: string, file: Buffer, contentType: string) {
    this.validate(file, contentType);
    if (SUPABASE_CONFIG_PRESENT) {
      const { url, serviceRoleKey } = getConfig();
      const extension = allowedContentTypes.get(contentType)!;
      const path = `${PROFILE_PREFIX}${employeeId}/${randomUUID()}.${extension}`;
      const objectPath = path.split('/').map(encodeURIComponent).join('/');
      const response = await fetch(`${url}/storage/v1/object/images/${objectPath}`, { method: 'POST', headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, 'Content-Type': contentType, 'x-upsert': 'false' }, body: file });
      if (!response.ok) throw await storageError(response);
      return `${url}/storage/v1/object/public/images/${objectPath}`;
    } else {
      return uploadLocal(employeeId, file, contentType);
    }
  },
  async removeByPublicUrl(publicUrl: string | null | undefined) {
    if (!publicUrl) return;
    if (SUPABASE_CONFIG_PRESENT) {
      const { url, serviceRoleKey } = getConfig();
      const publicPrefix = `${url}/storage/v1/object/public/images/`;
      if (!publicUrl.startsWith(publicPrefix)) return;
      const path = decodeURIComponent(publicUrl.slice(publicPrefix.length).split('?')[0]);
      if (!path.startsWith(PROFILE_PREFIX)) return;
      const response = await fetch(`${url}/storage/v1/object/images`, { method: 'DELETE', headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify([path]) });
      if (!response.ok) throw await storageError(response);
    } else {
      removeLocal(publicUrl);
    }
  },
};
