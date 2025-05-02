import express from "express";

import {
  getInstructorDashboard,
  getProfileDetails,
  updateProfile,
  deleteAccount,
  getCoursesInfoForAdmin,
  getUsersInfoForAdmin,
  getTotalStudentAndInstructor,
  getEarningByCourses,
  getEarningByMonth,
  getMostEnrolledCourses,
  deleteAccountByAdmin,
} from "../controllers/profile/profile.controller";

import { admin, auth, instructor } from "../middlewares/auth";

import upload from "../middlewares/multer";

const router = express.Router();

router.get("/profile-details", auth, getProfileDetails);
router.put("/update-profile", upload.single("image"), auth, updateProfile);
router.delete("/delete-account", auth, deleteAccount);

//Data for Instructor Dashboard
router.get("/instructor-dashboard", auth, instructor, getInstructorDashboard);
router.get("/get-earnings-by-month", auth, instructor, getEarningByMonth);
router.get("/get-earnings-by-course", auth, instructor, getEarningByCourses);

//Data for Admin Dashboard
router.get("/getCoursesInfoForAdmin", auth, admin, getCoursesInfoForAdmin);
router.get("/getUsersInfoForAdmin", auth, admin, getUsersInfoForAdmin);
router.get("/get-total-student-instructor", getTotalStudentAndInstructor);
router.get("/get-most-enrolled-courses", getMostEnrolledCourses);
router.delete("/delete-account-by-admin/:userId", deleteAccountByAdmin);

// router.get("/admin-dashboard", auth, admin, getAdminDashboardDetails);

export default router;
