// import User from "../../src/model/user";
import { IUser } from "../../src/interfaces/interface";
declare global {
  namespace Express {
    interface Request {
      currentUser: IUser;
    }
  }
}
