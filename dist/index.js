"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const database_1 = require("./configuration/database");
const errorHandler_1 = __importDefault(require("./middlewares/errorHandler"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const contact_routes_1 = __importDefault(require("./routes/contact.routes"));
const course_routes_1 = __importDefault(require("./routes/course.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const profile_routes_1 = __importDefault(require("./routes/profile.routes"));
const rating_routes_1 = __importDefault(require("./routes/rating.routes"));
const payment_controller_1 = require("./controllers/payment/payment.controller");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.set("trust proxy", 1);
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true, // Sends rate-limit headers
    legacyHeaders: false, // Disables old X-RateLimit headers
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: "Rate limit exceeded",
            message: "You have reached the maximum allowed requests. Try again later.",
        });
    },
});
app.use(express_1.default.urlencoded({ extended: false }));
app.use(limiter);
app.use((0, express_mongo_sanitize_1.default)());
const allowedOrigins = process.env.NODE_ENV === "production"
    ? [process.env.Frontend_Production_url || ""]
    : ["http://localhost:5173"];
const options = {
    origin: allowedOrigins,
    credentials: true,
};
app.use((0, cors_1.default)(options));
app.use("/webhook", express_1.default.raw({ type: "application/json" }));
app.use(express_1.default.json());
app.use("/api/v1/auth", auth_routes_1.default);
app.use("/api/v1/contact", contact_routes_1.default);
app.use("/api/v1/course", course_routes_1.default);
app.use("/api/v1/payment", payment_routes_1.default);
app.use("/api/v1/profile", profile_routes_1.default);
app.use("/api/v1/rating-and-review", rating_routes_1.default);
app.post("/webhook", payment_controller_1.stripeWebhook);
app.use(errorHandler_1.default);
app.get("/", function (req, res) {
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
(0, database_1.connectToDatabase)().then(() => {
    app.listen(PORT, function () {
        // console.log("Server is running");
        // console.log(`http://localhost:${PORT}`);
    });
});
