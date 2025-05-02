import { Schema } from "mongoose";

import User from "./user";
import { IStudent } from "../interfaces/interface";

const studentSchema: Schema<IStudent> = new Schema<IStudent>({
  enrolledCourses: [
    {
      type: Schema.Types.ObjectId,
      ref: "Course",
    },
  ],
  courseProgress: [
    {
      type: Schema.Types.ObjectId,
      ref: "CourseProgress",
    },
  ],
});

const Student = User.discriminator<IStudent>("Student", studentSchema);

export default Student;
