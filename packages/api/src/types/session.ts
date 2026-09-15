/** What the login and check endpoints return. */
export interface SessionResponse {
  token: string;
  user_id: number;
}

/** What the login endpoint expects. */
export interface LoginRequest {
  username: string;
  password: string;
}
