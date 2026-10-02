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

    return res
      .status(200)
      .json({
        message: "Usuário cadastrado com sucesso. Já pode iniciar sessão.",
      });
  } catch (error) {
    next(error);
  }
}
