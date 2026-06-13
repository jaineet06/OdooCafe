import multer from "multer";
import { cloudinary } from "../config/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new ApiError(422, "Only image files are allowed"));
    }
  },
});

export const uploadSingle = upload.single("image");

export const uploadToCloudinary = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "odoo-cafe/products", resource_type: "image" },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    stream.end(req.file.buffer);
  });

  req.imageUrl = result.secure_url;
  next();
});
