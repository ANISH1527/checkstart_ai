export interface UserRegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface UserLoginRequest {
  username: string; // OAuth2 password request form uses 'username' for email
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  created_at: string;
}
