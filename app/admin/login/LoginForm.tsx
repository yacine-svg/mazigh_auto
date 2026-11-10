"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LogIn, TriangleAlert } from "lucide-react";
import { signInAction, type SignInState } from "./actions";

const initialState: SignInState = null;

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(signInAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="grid gap-4">
      <div>
        <label htmlFor="admin-email" className="label">
          Adresse e-mail
        </label>
        <input id="admin-email" name="email" type="email" autoComplete="username" required className="field" />
      </div>

      <div>
        <label htmlFor="admin-password" className="label">
          Mot de passe
        </label>
        <div className="relative">
          <input
            id="admin-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="field !pr-11"
          />
          <button
            type="button"
            className="icon-btn absolute right-1 top-1/2 -translate-y-1/2"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </button>
        </div>
      </div>

      {state?.error && (
        <p className="alert alert-bad" role="alert">
          <TriangleAlert aria-hidden="true" /> {state.error}
        </p>
      )}

      <button className="btn btn-primary btn-lg mt-1 w-full" disabled={isPending}>
        <LogIn aria-hidden="true" />
        {isPending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
