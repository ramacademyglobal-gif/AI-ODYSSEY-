"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { BackLink } from "@/registration/admin/components/BackLink";
import { ROUTES } from "@/registration/admin/routes";
import { ApiError } from "@/registration/services/api";
import {
  adminLogin,
  clearAdminToken,
  fetchAdminSession,
  isAdminAuthenticated,
} from "@/registration/admin/services/adminAuth";
import "@/registration/admin/styles/admin.css";

type FieldErrors = {
  identifier?: string;
  password?: string;
};

function validateFields(identifier: string, password: string): FieldErrors {
  const errors: FieldErrors = {};

  if (!identifier.trim()) {
    errors.identifier = "Email or username is required";
  } else if (identifier.trim().length > 255) {
    errors.identifier = "Email or username is too long";
  }

  if (!password) {
    errors.password = "Password is required";
  } else if (password.length > 200) {
    errors.password = "Password is too long";
  }

  return errors;
}

export function AdminLoginPage() {
  const router = useRouter();
  const [settled, setSettled] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(true), 700);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isAdminAuthenticated()) {
      router.replace(ROUTES.admin);
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors = validateFields(identifier, password);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      await adminLogin(identifier.trim(), password);
      router.replace(ROUTES.admin);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400 && err.details.length > 0) {
          const next: FieldErrors = {};
          for (const detail of err.details) {
            const lower = detail.toLowerCase();
            if (lower.includes("password")) {
              next.password = detail;
            } else {
              next.identifier = detail;
            }
          }
          setFieldErrors(next);
        } else if (err.status === 429) {
          setFormError("Too many login attempts. Please wait and try again.");
        } else if (err.status === 401) {
          setFormError("Invalid email/username or password.");
        } else {
          setFormError(err.message);
        }
      } else {
        setFormError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={`page page--admin-login${settled ? " is-settled" : ""}`}>
      <section className="admin-login">
        <BackLink to={ROUTES.home} className="back-link back-link--login">
          Site home
        </BackLink>
        <p className="section-label">ORGANIZER ACCESS</p>
        <h1>Admin Login</h1>
        <p className="lead">Sign in to access AI ODYSSEY 24 organizer tools.</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field full-width">
            <label htmlFor="admin-identifier">Email or username</label>
            <input
              id="admin-identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (fieldErrors.identifier) {
                  setFieldErrors((prev) => ({ ...prev, identifier: undefined }));
                }
              }}
              disabled={loading}
              aria-invalid={Boolean(fieldErrors.identifier)}
              aria-describedby={
                fieldErrors.identifier ? "admin-identifier-error" : undefined
              }
            />
            {fieldErrors.identifier ? (
              <p id="admin-identifier-error" className="field-error">
                {fieldErrors.identifier}
              </p>
            ) : null}
          </div>

          <div className="form-field full-width">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              disabled={loading}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={
                fieldErrors.password ? "admin-password-error" : undefined
              }
            />
            {fieldErrors.password ? (
              <p id="admin-password-error" className="field-error">
                {fieldErrors.password}
              </p>
            ) : null}
          </div>

          {formError ? (
            <p className="field-error" role="alert">
              {formError}
            </p>
          ) : null}

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}

type ProtectedAdminRouteProps = {
  children: ReactNode;
};

export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<"checking" | "ok" | "denied">(() =>
    isAdminAuthenticated() ? "checking" : "denied",
  );

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      if (!isAdminAuthenticated()) {
        if (!cancelled) setStatus("denied");
        return;
      }

      try {
        await fetchAdminSession();
        if (!cancelled) setStatus("ok");
      } catch {
        clearAdminToken();
        if (!cancelled) setStatus("denied");
      }
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status === "denied") {
      router.replace(ROUTES.adminLogin);
    }
  }, [status, router, pathname]);

  if (status === "checking" || status === "denied") {
    return (
      <main className="page page--admin">
        <p className="lead">
          {status === "denied" ? "Redirecting to login…" : "Verifying session…"}
        </p>
      </main>
    );
  }

  return <>{children}</>;
}
