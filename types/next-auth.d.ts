import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    rememberMe?: boolean;
    isAdmin?: boolean;
    sessionVersion?: number;
  }

  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      isAdmin?: boolean;
      sessionVersion?: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    rememberMe?: boolean;
    isAdmin?: boolean;
    sessionVersion?: number;
  }
}
