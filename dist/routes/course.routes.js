"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("../middlewares/multer"));
const auth_1 = require("../middlewares/auth");
const course_controller_1 = require("../controllers/course/course.controller");
const courseQuery_controller_1 = require("../controllers/course/courseQuery.controller");
const courseProgress_controller_1 = require("../controllers/course/courseProgress.controller");
const section_controller_1 = require("../controllers/course/section/section.controller");
const subSection_controller_1 = require("../controllers/course/section/subSection.controller");
const router = (0, express_1.Router)();
router.post("/create-course", multer_1.default.single("image"), auth_1.auth, auth_1.instructor, course_controller_1.createCourse);
router.patch("/edit-course/:courseId", multer_1.default.single("image"), auth_1.auth, auth_1.instructor, course_controller_1.editCourse);
router.patch("/update-course-status/:courseId", auth_1.auth, auth_1.instructor, course_controller_1.updateCourseStatus);
router.post("/delete-course-by-instructor/:courseId", auth_1.auth, auth_1.instructor, course_controller_1.deleteCourseByInstructor);
router.post("/delete-course-by-admin/:courseId", auth_1.auth, auth_1.admin, course_controller_1.deleteCourseByAdmin);
router.get("/get-course-progress", auth_1.auth, auth_1.student, courseProgress_controller_1.getCourseProgress);
router.get("/enrolled-courses", auth_1.auth, auth_1.student, course_controller_1.getCourseByUser);
router.get("/get-courses", course_controller_1.getPagination);
router.get("/top-courses", courseQuery_controller_1.getTopCourses);
router.get("/get-all-courses", course_controller_1.getAllCourses);
router.get("/category/:category", courseQuery_controller_1.getCourseByCategory);
router.get("/search/:searchQuery", courseQuery_controller_1.getSearchResults);
router.get("/:id", course_controller_1.getCourseById);
router.patch("/update-course-progress/:courseId/:subSectionId", auth_1.auth, auth_1.student, courseProgress_controller_1.updateCourseProgress);
// ++++++++++++++++++++++++++++++++++++++++++++++++++
//                   Section Route
// ++++++++++++++++++++++++++++++++++++++++++++++++++
router.post("/add-section/:courseId", section_controller_1.addSection);
router.patch("/update-section/:courseId/:sectionId", section_controller_1.updateSection);
router.post("/delete-section/:courseId/:sectionId", section_controller_1.deleteSection);
// ++++++++++++++++++++++++++++++++++++++++++++++++++
//                   Sub - Section Route
// ++++++++++++++++++++++++++++++++++++++++++++++++++
router.post("/add-subSection/:sectionId", multer_1.default.single("video"), subSection_controller_1.addSubSection);
router.patch("/update-subSection/:sectionId/:subSectionId", multer_1.default.single("video"), subSection_controller_1.updateSubSection);
router.post("/delete-subSection/:sectionId/:subSectionId", subSection_controller_1.deleteSubSection);
exports.default = router;
