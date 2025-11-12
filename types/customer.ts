export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "USER";
}
