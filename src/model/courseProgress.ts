import { Schema, model } from "mongoose";
import { ICourseProgress } from "../interfaces/interface";

const courseProgressSchema = new Schema<ICourseProgress>({
  courseId: {
    type: Schema.Types.ObjectId,
    ref: "course",
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  completedVideos: [
    {
      type: Schema.Types.ObjectId,
      ref: "subSection",
    },
  ],
});

const CourseProgress = model("CourseProgress", courseProgressSchema);

export default CourseProgress;
