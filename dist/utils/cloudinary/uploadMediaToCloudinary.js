"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cloudinary_1 = require("cloudinary");
const fs_1 = __importDefault(require("fs"));
const cloudinary_2 = require("../../configuration/cloudinary");
const example = (0, cloudinary_2.cloudinaryConnect)();
const uploadMediaToCloudinary = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const options = {
            folder: "Learning_website",
            resource_type: "auto",
            quality: "auto:low", // Set quality to auto, which automatically applies lossy compression
            resize: "width:800,height:800", // Resize the image to reduce dimensions
        };
        const result = yield cloudinary_1.v2.uploader.upload(filePath, options);
        fs_1.default.unlinkSync(filePath);
        return result;
    }
    catch (error) {
        // delete the file from our temporary storage if any error
        // occurred while uploading to cloudinary
        // so any malicious image/video should not be create issue on server
        fs_1.default.unlinkSync(filePath);
        throw new Error("error occurred while uploading media to cloudinary ");
    }
});
exports.default = uploadMediaToCloudinary;
