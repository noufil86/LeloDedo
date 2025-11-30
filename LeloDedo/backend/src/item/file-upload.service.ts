import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileUploadService {
  private uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadImage(file: any): Promise<string> {
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file size (5MB max)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error('File size exceeds 5MB limit');
    }

    // Validate file type
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed');
    }

    // Generate unique filename
    const ext = path.extname(file.originalname);
    const fileName = `item-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
    const filePath = path.join(this.uploadDir, fileName);

    // Write file to disk
    await fs.promises.writeFile(filePath, file.buffer);

    // Return relative URL path
    return `/uploads/${fileName}`;
  }

  async deleteImage(relativePath: string): Promise<void> {
    try {
      if (relativePath.startsWith('/uploads/')) {
        const fileName = relativePath.replace('/uploads/', '');
        const filePath = path.join(this.uploadDir, fileName);

        // Ensure path is within uploads directory (security)
        const resolved = path.resolve(filePath);
        if (!resolved.startsWith(path.resolve(this.uploadDir))) {
          throw new Error('Invalid file path');
        }

        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
      }
    } catch (err) {
      console.error(`Error deleting file ${relativePath}:`, err);
    }
  }
}

