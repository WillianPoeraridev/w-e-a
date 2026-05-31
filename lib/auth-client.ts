"use client";

import { createAuthClient } from "better-auth/react";

/** Same-origin client — requests go to /api/auth on whatever host serves us. */
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
