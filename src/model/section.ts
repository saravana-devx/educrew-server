import { Schema, model } from "mongoose";
import { ISection } from "../interfaces/interface";

const sectionSchema = new Schema<ISection>({
  sectionName: {
    type: String,
  },
  subSection: [
    {
      type: Schema.Types.ObjectId,
      ref: "subSection",
    },
  ],
});

const Section = model("Section", sectionSchema);

export default Section;
