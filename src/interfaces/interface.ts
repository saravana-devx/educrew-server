import { Date, Document, ObjectId, Types } from "mongoose";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  accountType: string;
  image: string;
  isActive: Boolean;
  verificationToken?: String;
  token: string;
  additionalDetails: ObjectId;
}

export interface IInstructor extends IUser {
  earnings: number;
  courses: ObjectId[];
}

export interface CourseProgress {
  courseId: ObjectId;
  userId: ObjectId;
  completedVideos: ObjectId[];
}

export interface IStudent extends IUser {
  enrolledCourses: Types.ObjectId[];
  courseProgress: CourseProgress[];
}

export interface iProfile extends Document {
  gender: string;
  dob: Date;
  about: string;
  contactNumber: string;
}

export interface ICourses extends Document {
  courseName: string;
  instructor: ObjectId;
  description: string;
  content: ObjectId[];
  ratingAndReview: ObjectId[];
  price: number;
  thumbnail: string;
  category: string;
  studentEnrolled: ObjectId[];
  whatYouWillLearn: String[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISection extends Document {
  sectionName: string;
  subSection: ObjectId;
}

export interface ISubSection extends Document {
  title: string;
  timeDuration: string;
  description: string;
  video: string;
}

export interface ICourseProgress extends Document {
  courseId: ObjectId;
  completedVideos: ObjectId;
  userId: ObjectId;
}

export interface IInvoice extends Document {
  user: ObjectId;
  courseName: string;
  price: number;
  // address: string;
  // pinCode: number;
  courseId: ObjectId;
}

export interface IRatingAndReview extends Document {
  user: ObjectId;
  rating: number;
  review: string;
  course: ObjectId;
}

export interface IContact extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
}
