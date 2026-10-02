import { register, login } from "./handlers/auth.js";
import { authGuard } from "./handlers/guard.js";
import { listMyFriends, createFriend, findMyFriend } from "./handlers/friends.js";

export default function routes(app, opts) {
  app.post("/register", register);
  app.post("/login", login);
  app.get("/teste", authGuard, (req, res) => {
    return res
      .status(200)
      .json({ message: "acesso liberado!", user: req.user });
  });
  app.get("/friends/:email", authGuard, findMyFriend);
  app.get("/friends", authGuard, listMyFriends);
  app.post("/friends", authGuard, createFriend);
}
