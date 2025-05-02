"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const profile_controller_1 = require("../controllers/profile/profile.controller");
const auth_1 = require("../middlewares/auth");
const multer_1 = __importDefault(require("../middlewares/multer"));
const router = express_1.default.Router();
router.get("/profile-details", auth_1.auth, profile_controller_1.getProfileDetails);
router.put("/update-profile", multer_1.default.single("image"), auth_1.auth, profile_controller_1.updateProfile);
router.delete("/delete-account", auth_1.auth, profile_controller_1.deleteAccount);
//Data for Instructor Dashboard
router.get("/instructor-dashboard", auth_1.auth, auth_1.instructor, profile_controller_1.getInstructorDashboard);
router.get("/get-earnings-by-month", auth_1.auth, auth_1.instructor, profile_controller_1.getEarningByMonth);
router.get("/get-earnings-by-course", auth_1.auth, auth_1.instructor, profile_controller_1.getEarningByCourses);
//Data for Admin Dashboard
router.get("/getCoursesInfoForAdmin", auth_1.auth, auth_1.admin, profile_controller_1.getCoursesInfoForAdmin);
router.get("/getUsersInfoForAdmin", auth_1.auth, auth_1.admin, profile_controller_1.getUsersInfoForAdmin);
router.get("/get-total-student-instructor", profile_controller_1.getTotalStudentAndInstructor);
router.get("/get-most-enrolled-courses", profile_controller_1.getMostEnrolledCourses);
router.delete("/delete-account-by-admin/:userId", profile_controller_1.deleteAccountByAdmin);
// router.get("/admin-dashboard", auth, admin, getAdminDashboardDetails);
exports.default = router;
