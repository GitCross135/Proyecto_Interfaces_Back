import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for event images
export const eventStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'quorum/events',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 800, height: 600, crop: 'fill' }],
    },
});

// Storage for avatar images
export const avatarStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'quorum/avatars',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
    },
});

export const uploadEvent = multer({ storage: eventStorage });
export const uploadAvatar = multer({ storage: avatarStorage });