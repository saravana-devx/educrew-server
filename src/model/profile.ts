import { Schema, model } from "mongoose";
import { iProfile } from "../interfaces/interface";

const profileSchema = new Schema<iProfile>({
  gender: {
    type: String,
    enum: ["male", "female"],
  },
  dob: {
    type: Date,
  },
  about: {
    type: String,
  },
  contactNumber: {
    type: String,
  },
});

const Profile = model("Profile", profileSchema);

export default Profile;
