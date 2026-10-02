import { register, login } from "./handlers/auth.js";

export default function routes(app, opts) {
  app.post("/register", register);
  app.post("/login", login);
}
