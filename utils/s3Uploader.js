// utils/s3Uploader.js
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// Needed to resolve __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// S3 client setup
const s3 = new S3Client({
  region: process.env.CUSTOM_AWS_REGION,
  credentials: {
    accessKeyId: process.env.CUSTOM_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.CUSTOM_AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

export const uploadToS3 = async ({ file, folder = 'uploads', prefix = '' }) => {
  if (!file || !file.buffer) {
    console.error('Invalid file or missing buffer:', file);
    throw new Error('Invalid file');
  }

  const fileNameSource = file.originalname || file.filename || '';
  const extension = path.extname(fileNameSource) || '.jpg';
  const fileName = `${prefix}${Date.now()}${extension}`;
  const s3Key = `${folder}/${fileName}`;

  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: s3Key,
    Body: file.buffer,
    ContentType: file.mimetype || 'image/jpeg'
  };

  try {
    console.log('Uploading to S3 with params:', uploadParams);
    const result = await s3.send(new PutObjectCommand(uploadParams));
    console.log('Upload Success:', result);

    const s3Url = `https://${BUCKET_NAME}.s3.${process.env.CUSTOM_AWS_REGION}.amazonaws.com/${s3Key}`;
    return s3Url;
  } catch (error) {
    console.error('S3 Upload Failed:', error);
    throw error;
  }
};


export const deleteObjectFromS3 = async (key) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
  };

  await s3.send(new DeleteObjectCommand(params));
};


