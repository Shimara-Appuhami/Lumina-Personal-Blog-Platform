import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

export const ensureUploadsDir = async () => {
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
  } catch (error) {
  }
};

export const saveBufferToDisk = async (buffer, filename) => {
  await ensureUploadsDir();
  const filePath = path.join(uploadsDir, filename);
  await fs.writeFile(filePath, buffer);
  return filePath;
};

export const deleteFromDisk = async (filePath) => {
  if (!filePath) {
    return;
  }
  try {
    await fs.unlink(filePath);
  } catch (error) {
  }
};
