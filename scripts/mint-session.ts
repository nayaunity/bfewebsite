import { encode } from "@auth/core/jwt";
import * as fs from "fs";
import * as path from "path";

const secret = process.env.AUTH_SECRET!;
if (!secret) { console.error("AUTH_SECRET missing"); process.exit(1); }

const token = await encode({
  token: {
    sub: "test-user-1",
    email: "test@test.com",
    name: "Test User",
    role: "user",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    jti: "dev-jti",
  },
  secret,
  salt: "authjs.session-token",
});

console.log(token);
