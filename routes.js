import { register } from "./handlers/auth.js";

export default function routes(app, opts) {
  app.post("/register", register);
}
