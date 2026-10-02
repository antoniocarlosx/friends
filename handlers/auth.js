import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../prisma.js";

//registro
export async function register(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(404)
        .json({ message: "Nome de usuário ou senha ausentes." });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(404).json({ message: "Usuário já existe!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });

    return res.status(200).json({
      message: "Usuário cadastrado com sucesso. Já pode iniciar sessão.",
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(404)
        .json({ message: "Erro ao logar: campos ausentes" });
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res
        .status(208)
        .json({ message: "Login inválido, verifique o usuário e a senha" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!password) {
      return res
        .status(208)
        .json({ message: "Login inválido, verifique o usuário e a senha" });
    }

    const accessToken = jwt.sign(
      { userId: user.userId, username: user.username },
      "access",
      { expiresIn: 60 * 60 },
    );

    req.session.authorization = {
      accessToken,
      username: user.username,
    };
    return res.status(200).send("Usuário autenticado com sucesso!");
  } catch (error) {
    next(error);
  }
}
