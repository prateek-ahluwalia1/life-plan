export type RegisterBody = {
  email: string;
  password: string;
  confirmPassword: string;
};

export type LoginBody = {
  email: string;
  password: string;
};

export type VerifyOtpBody = {
  email: string;
  otp: string;
};

export type ForgotPasswordBody = {
  email: string;
};

export type ResetPasswordBody = {
  email: string;
  token: string;
  password: string;
  confirmPassword: string;
};
