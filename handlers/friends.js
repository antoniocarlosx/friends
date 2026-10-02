import { read } from "node:fs";
import prisma from "../prisma.js";

export async function createFriend(req, res, next) {
  try {
    const requiredFields = [
      "email",
      "telefone",
      "firstName",
      "lastName",
      "DOB",
    ];

    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "Falha ao criar: Campos obrigatórios ausentes",
        missing: missingFields,
      });
    }

    const { email, telefone, firstName, lastName, DOB } = req.body;

    const loggedUserId = req.user?.userId;

    if (!loggedUserId) {
      return res.status(401).json({
        message: "Usuário não identificado na sessão. Faça login novamente.",
      });
    }

    const existingFriend = await prisma.friend.findUnique({
      where: {
        userId_email: {
          userId: loggedUserId,
          email: email,
        },
      },
    });

    if (existingFriend) {
      return res
        .status(409)
        .json({ message: "Não é possível adicionar amigos com mesmo email" });
    }

    const fixDOB = DOB.includes("/") ? DOB.replace("/", "-") : DOB;
    const formatedData = new Date(fixDOB);

    if (isNaN(formatedData.getTime())) {
      res.status(400).json({ message: "Data de nascimento inválida" });
    }

    const newFriend = await prisma.friend.create({
      data: {
        email,
        telefone,
        firstName,
        lastName,
        DOB: formatedData,
        userId: loggedUserId,
      },
    });

    return res.status(201).json(newFriend);
  } catch (error) {
    next(error);
  }
}

export async function listMyFriends(req, res, next) {
  try {
    const allFriends = await prisma.friend.findMany({
      where: {
        userId: req.user.userId,
      },
    });
    if (allFriends.length === 0) {
      return res
        .status(404)
        .json({ message: "Usuário sem amigos cadastrados" });
    }
    res.status(200).json(allFriends);
  } catch (error) {
    next(error);
  }
}

export async function findMyFriend(req, res, next) {
  try {
    const mailFriend = req.params.email;

    if (!mailFriend) {
      return res.status(400).json({ message: "Parâmetros inválidos" });
    }

    const myFriend = await prisma.friend.findFirst({
      where: { email: mailFriend, userId: req.user.userId },
    });

    if (!myFriend) {
      return res.status(400).json({ message: "Amigo não encontrado" });
    }

    res.status(200).json(myFriend);
  } catch (error) {
    next(error);
  }
}

export async function updateMyFriend(req, res, next) {
  try {
    const mailFriend = req.params.email;
    if (!mailFriend) {
      return res.status(400).json({ message: "Parâmetros inválidos" });
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .json({ message: "Nenhum dado foi enviado para atualizar" });
    }

    const { firstName, lastName, telefone, DOB } = req.body;

    if (!mailFriend) {
      return res.status(400).json({ message: "Parâmetros inválidos" });
    }

    const updatedFriend = await prisma.friend.updateMany({
      where: {
        email: mailFriend,
        userId: req.userId,
      },
      data: {
        firstName,
        lastName,
        telefone,
        DOB,
      },
    });

    if (updatedFriend.count === 0) {
      return res
        .status(404)
        .json({ message: "Amigo não encontrado para atualizar" });
    }

    res.json({
      message: "Amigo atualizado com sucesso",
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteMyFriend(req, res, next) {
  try {
    const mailFriend = req.params.email;

    if (!mailFriend) {
      return res.status(400).json({ message: "Parâmetros inválidos" });
    }

    const deletedFriend = await prisma.friend.deleteMany({
      where: {
        userId: req.user.userId,
        email: mailFriend,
      },
    });

    if (deletedFriend === 0) {
      return res.status(400).json({ message: "Amigo não encontrado" });
    }

    res.json({ message: "Amigo excluído com sucesso!" });
  } catch (error) {
    next(error);
  }
}
