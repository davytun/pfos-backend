require("dotenv").config();
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const Product = require("./models/productModel");
const fs = require("fs");
const path = require("path");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    const products = await Product.find();
    for (const product of products) {
      if (!product.image.startsWith("http")) {
        const imagePath = path.join(
          __dirname,
          "uploads",
          product.image.split("/").pop()
        );
        if (fs.existsSync(imagePath)) {
          try {
            const result = await cloudinary.uploader.upload(imagePath);
            product.image = result.secure_url;
            await product.save();
            console.log(`Updated ${product.name} with ${result.secure_url}`);
          } catch (error) {
            console.error(`Failed to upload ${product.name}:`, error);
          }
        } else {
          console.log(
            `Skipping ${product.name} - Image not found at ${imagePath}`
          );
        }
      } else {
        console.log(
          `Skipping ${product.name} - Already has a URL: ${product.image}`
        );
      }
    }
    console.log("Migration complete");
    process.exit(0);
  })
  .catch((err) => {
    console.error("MongoDB error:", err);
    process.exit(1);
  });
