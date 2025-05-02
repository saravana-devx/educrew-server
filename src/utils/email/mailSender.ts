import { createTransport } from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// <Promise>:any --> is used when we don't know the type of value return by the function
const mailSender = async (
  email: string,
  title: string,
  body: string
): Promise<any> => {
  try {
    let transporter = createTransport({
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
    let info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    // console.log("Error in mailSender : ", error);
    throw Error("Something went wrong while sending email.");
  }
};

export default mailSender;
