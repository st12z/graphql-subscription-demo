import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { pubsub, EVENTS } from "../pubsub.js";
import { DateScalar } from "../scalar/graphql-scalar-type.js";
export const resolverUser = {
  Date: DateScalar,
  Query: {
    
  },
  Mutation: {
    
  },
  Subscription: {
   
  },
};
