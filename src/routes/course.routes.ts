import { Router } from "express";

import upload from "../middlewares/multer";
import { admin, auth, instructor, student } from "../middlewares/auth";

import {
  createCourse,
  editCourse,
  getAllCourses,
  getCourseById,
  getCourseByUser,
  updateCourseStatus,
  deleteCourseByAdmin,
  deleteCourseByInstructor,
  getPagination,
} from "../controllers/course/course.controller";

import {
  getTopCourses,
  getCourseByCategory,
  getSearchResults,
} from "../controllers/course/courseQuery.controller";

import {
  getCourseProgress,
  updateCourseProgress,
} from "../controllers/course/courseProgress.controller";

import {
  addSection,
  deleteSection,
  updateSection,
} from "../controllers/course/section/section.controller";

import {
  addSubSection,
  updateSubSection,
  deleteSubSection,
} from "../controllers/course/section/subSection.controller";

const router = Router();

router.post(
  "/create-course",
  upload.single("image"),
  auth,
  instructor,
  createCourse
);
router.patch(
  "/edit-course/:courseId",
  upload.single("image"),
  auth,
  instructor,
  editCourse
);

router.patch(
  "/update-course-status/:courseId",
  auth,
  instructor,
  updateCourseStatus
);

router.post(
  "/delete-course-by-instructor/:courseId",
  auth,
  instructor,
  deleteCourseByInstructor
);

router.post(
  "/delete-course-by-admin/:courseId",
  auth,
  admin,
  deleteCourseByAdmin
);

router.get("/get-course-progress", auth, student, getCourseProgress);
router.get("/enrolled-courses", auth, student, getCourseByUser);
router.get("/get-courses", getPagination);
router.get("/top-courses", getTopCourses);
router.get("/get-all-courses", getAllCourses);
router.get("/category/:category", getCourseByCategory);
router.get("/search/:searchQuery", getSearchResults);
router.get("/:id", getCourseById);

router.patch(
  "/update-course-progress/:courseId/:subSectionId",
  auth,
  student,
  updateCourseProgress
);

// ++++++++++++++++++++++++++++++++++++++++++++++++++
//                   Section Route
// ++++++++++++++++++++++++++++++++++++++++++++++++++

router.post("/add-section/:courseId", addSection);
router.patch("/update-section/:courseId/:sectionId", updateSection);
router.post("/delete-section/:courseId/:sectionId", deleteSection);

// ++++++++++++++++++++++++++++++++++++++++++++++++++
//                   Sub - Section Route
// ++++++++++++++++++++++++++++++++++++++++++++++++++

router.post(
  "/add-subSection/:sectionId",
  upload.single("video"),
  addSubSection
);
router.patch(
  "/update-subSection/:sectionId/:subSectionId",
  upload.single("video"),
  updateSubSection
);
router.post("/delete-subSection/:sectionId/:subSectionId", deleteSubSection);

export default router;
