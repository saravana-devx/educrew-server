import express, { Application, Request, Response } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";

import { connectToDatabase } from "./configuration/database";

import errorMiddleware from "./middlewares/errorHandler";

import authRoute from "./routes/auth.routes";
import contactRoute from "./routes/contact.routes";
import courseRoute from "./routes/course.routes";
import paymentRoute from "./routes/payment.routes";
import profileRoute from "./routes/profile.routes";
import ratingRoute from "./routes/rating.routes";

import { stripeWebhook } from "./controllers/payment/payment.controller";


import dotenv from "dotenv";
dotenv.config();

const app: Application = express();

app.set("trust proxy", 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true, // Sends rate-limit headers
  legacyHeaders: false, // Disables old X-RateLimit headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Rate limit exceeded",
      message:
        "You have reached the maximum allowed requests. Try again later.",
    });
  },
});

app.use(express.urlencoded({ extended: false }));

app.use(limiter);

app.use(mongoSanitize());

const allowedOrigins: (string )[] =
  process.env.NODE_ENV === "production"
    ? [process.env.Frontend_Production_url || ""]
    : ["http://localhost:5173"];



const options: cors.CorsOptions = {
  origin: allowedOrigins,
  credentials: true,
};
app.use(cors(options));

app.use("/webhook", express.raw({ type: "application/json" }));

app.use(express.json());

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/contact", contactRoute);
app.use("/api/v1/course", courseRoute);
app.use("/api/v1/payment", paymentRoute);
app.use("/api/v1/profile", profileRoute);
app.use("/api/v1/rating-and-review", ratingRoute);

app.post("/webhook", stripeWebhook);

app.use(errorMiddleware);

app.get("/", function (req: Request, res: Response): void {
  res.send("<h1>Server is running</h1>");
});

app.all("*", (req, res) => {
  res.status(404).json({
    status: 404,
    success: false,
    message: "!Oops page not found",
  });
});

const PORT = process.env.PORT;

connectToDatabase().then(() => {
  app.listen(PORT, function () {
    // console.log("Server is running");
    // console.log(`http://localhost:${PORT}`);
  });
});
