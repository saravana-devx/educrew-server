import { Router } from "express";

import { deleteQuery, postQuery } from "../controllers/contact/contact.controller";

const router = Router();

router.post("/send-query", postQuery);
router.post("/delete-query/:queryId", deleteQuery);

export default router;
