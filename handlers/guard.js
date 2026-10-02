import jwt from "jsonwebtoken";
import "dotenv/config";

export async function authGuard(req, res, next) {
  try {
    const authSession = req.session;

    if (!authSession?.authorization) {
      return res.status(401).json({ message: "Usuário não está logado" });
    }

    const secret = process.env.JWT_SECRET;
    const decoded = jwt.verify(authSession.authorization.accessToken, secret);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(403).json({ message: "Usuário não autenticado" });
  }
}
