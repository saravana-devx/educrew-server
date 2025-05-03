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
const nodemailer_1 = require("nodemailer");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// <Promise>:any --> is used when we don't know the type of value return by the function
const mailSender = (email, title, body) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let transporter = (0, nodemailer_1.createTransport)({
            host: process.env.MAIL_HOST,
            port: 587, // Port for STARTTLS
            secure: false,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });
        const mailOptions = {
            from: "venom86224@gmail.com - educrew.com",
            to: email,
            subject: title,
            html: body,
        };
        let info = yield transporter.sendMail(mailOptions);
        return info;
    }
    catch (error) {
        // console.log("Error in mailSender : ", error);
        throw Error("Something went wrong while sending email.");
    }
});
exports.default = mailSender;
