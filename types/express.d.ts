declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export {}; 