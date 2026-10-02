import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../prisma.js";

// Registro
export async function register(req, res, next) {
  try {
    // 1. Pega o objeto com usuário e a senha passados no body
    const { username, password } = req.body;

    // Verifica se os valores foram digitados e se não emite uma messagem com status 404
    if (!username || !password) {
      return res
        .status(404)
        .json({ message: "Erro ao logar: campos ausentes" });
    }

    // 2. Verifica se o usuário que está se cadastrand já não existe
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    // Se existir emite mensagem de erro com status 404
    if (existingUser) {
      return res.status(404).json({ message: "Usuário já existe!" });
    }

    // Caso esteja tudo certo, codifica a senha para armazena-la
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Cria o novo usuário após validar que o usuário não está cadastrado e codificar a senha digitada, armazenando a codificação.
    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });

    // 4. Se o cadastro ocorreu tudo bem, emite mensagem de sucesso com status 200
    return res.status(200).json({
      message: "Usuário cadastrado com sucesso. Já pode iniciar sessão.",
    });
  } catch (error) {
    // Se algo deu errado avança para o próximo middleare e comunica a causa do insucesso
    next(error);
  }
}

// Login
export async function login(req, res, next) {
  try {
    // 1. Recebe o objeto passado no body
    const { username, password } = req.body;

    // Verifica se foi digitado
    if (!username || !password) {
      return res
        .status(404)
        .json({ message: "Erro ao logar: campos ausentes" });
    }

    // 2. Filtra o usuário digitado no banco
    const user = await prisma.user.findUnique({
      where: { username },
    });

    // Se o usuario NÃO existir no banco, retorna erro (enquanto na função de registro verifica se existe, a de login verifica se não existe)
    if (!user) {
      return res
        .status(208)
        .json({ message: "Login inválido, verifique o usuário e a senha" });
    }

    //3. Codifica a senha digitada e, compara essa codificação com a armazenada no banco
    const passwordMatch = await bcrypt.compare(password, user.password);

    // Se não bater retorna erro
    if (!passwordMatch) {
      return res
        .status(208)
        .json({ message: "Login inválido, verifique o usuário e a senha" });
    }

    // 4. Cria o token de acesso no navegador com tempo limite de expiração
    const accessToken = jwt.sign(
      { userId: user.userId, username: user.username },
      "access",
      { expiresIn: 60 * 60 },
    );

    // Cria um objeto authorization contendo o token de acesso do navegador e o nome do usuário na memória do servidor
    req.session.authorization = {
      accessToken,
      username: user.username,
    };

    // Dando tudo certo, Emite mensagem de sucesso
    return res.status(200).send("Usuário autenticado com sucesso!");
  } catch (error) {
    next(error);
  }
}
