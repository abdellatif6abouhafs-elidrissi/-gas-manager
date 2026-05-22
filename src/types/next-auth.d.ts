import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string;
      email?: string;
      image?: string;
      role?: "gerant" | "directeur";
      station?: string;
    };
  }

  interface User {
    id: string;
    name?: string;
    email?: string;
    role?: "gerant" | "directeur";
    station?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "gerant" | "directeur";
    station?: string;
    sub?: string;
  }
}
