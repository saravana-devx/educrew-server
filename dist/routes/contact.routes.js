"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contact_controller_1 = require("../controllers/contact/contact.controller");
const router = (0, express_1.Router)();
router.post("/send-query", contact_controller_1.postQuery);
router.post("/delete-query/:queryId", contact_controller_1.deleteQuery);
exports.default = router;
