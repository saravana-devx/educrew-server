import { Schema, model } from "mongoose";
import { IInstructor } from "../interfaces/interface";
import User from "./user";

const instructorSchema: Schema<IInstructor> = new Schema<IInstructor>({
  earnings: {
    type: Number,
    default: 0,
  },
  courses: [
    {
      type: Schema.Types.ObjectId,
      ref: "Course",
      default: [],
    },
  ],
});

const Instructor = User.discriminator<IInstructor>(
  "Instructor",
  instructorSchema
); 

export default Instructor;
