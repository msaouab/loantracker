import { apiOk } from "@/lib/api-response";
import bcrypt from "bcryptjs";
import { toErrorResponse } from "@/lib/api-handler";
import { prisma } from "@/lib/db";
import { parseOrThrow, ValidationError } from "@/lib/errors";
import { registerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const { fullName, email, password } = parseOrThrow(
      registerSchema,
      await request.json()
    );

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ValidationError({ email: ["Email already registered"] });
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

    return apiOk({ success: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
