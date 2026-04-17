import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  token: string | null;
  userdata: UserProfile | null;
}

const initialState: AuthState = {
  token: null,
  userdata: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (
      state,
      action: PayloadAction<{ token: string; userdata: UserProfile }>,
    ) => {
      state.token = action.payload.token;
      state.userdata = action.payload.userdata;
    },
    logout: (state) => {
      state.token = null;
      state.userdata = null;
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
