import { apiOk } from "@/lib/api-response";
import bcrypt from "bcryptjs";
import { toErrorResponse } from "@/lib/api-handler";
import { prisma } from "@/lib/db";
import { ConflictError, parseOrThrow } from "@/lib/errors";
import { getErrorMessage } from "@/lib/server-errors";
import { getRegisterSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const registerSchema = await getRegisterSchema();
    const { fullName, email, password } = parseOrThrow(
      registerSchema,
      await request.json()
    );

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      const message = await getErrorMessage("emailRegistered");
      throw new ConflictError(message, {
        email: [message],
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        isActivated: false,
      },
    });

    return apiOk({ success: true }, { status: 201 });
  } catch (error) {
    return await toErrorResponse(error);
  }
}
