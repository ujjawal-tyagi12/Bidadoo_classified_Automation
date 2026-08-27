export type LoginRequestBody = {
  email: string;
  password: string;
  stayLoggedIn: boolean;
};

export type LoginResponse = {
  statusCode: number;
  message: string;
  result: {
    authToken: string;
    refreshToken: string;
  };
};
