import { v2 as cloudinary, UploadApiOptions } from "cloudinary";
import fs from "fs";
import { cloudinaryConnect } from "../../configuration/cloudinary";
const example = cloudinaryConnect();
const uploadMediaToCloudinary = async (filePath: string) => {
  try {
    const options: UploadApiOptions = {
      folder: "Learning_website",
      resource_type: "auto",
      quality: "auto:low", // Set quality to auto, which automatically applies lossy compression
      resize: "width:800,height:800", // Resize the image to reduce dimensions
    };
    const result = await cloudinary.uploader.upload(filePath, options);
    fs.unlinkSync(filePath);
    return result;
  } catch (error) {
    // delete the file from our temporary storage if any error
    // occurred while uploading to cloudinary
    // so any malicious image/video should not be create issue on server
    fs.unlinkSync(filePath);
    throw new Error("error occurred while uploading media to cloudinary ");
  }
};

export default uploadMediaToCloudinary;
