import { Schema, model } from "mongoose";
import { ISubSection } from "../interfaces/interface";

const subSectionSchema = new Schema<ISubSection>({
  title: {
    type: String,
  },
  timeDuration: {
    type: String,
  },
  description: {
    type: String,
  },
  video: {
    type: String,
  },
});

const SubSection = model("SubSection", subSectionSchema);

export default SubSection;
