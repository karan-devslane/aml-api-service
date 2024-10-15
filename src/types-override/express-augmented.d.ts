import { Learner } from '../models/learner';

declare module 'express' {
  export interface Request {
    learner?: Learner;
  }
}
