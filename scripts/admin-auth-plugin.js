import { parseCookies, readBody, redirect, sendJson } from "./admin/http.js";
import { sendLoginPage } from "./admin/login-page.js";
import { COOKIE_NAME, clearSession, safeEqual, setSession, verifySessionCookie } from "./admin/session.js";
import { applyTextEditToSource, resolveEditableHtmlPath, writeTextEdit } from "./admin/text-edit.js";

export { applyTextEditToSource, resolveEditableHtmlPath };

function sendAdminHome(res) {
  redirect(res, "/?admin=1");
}

export function portfolioAdminAuthPlugin() {
  const adminUsername = process.env.PORTFOLIO_ADMIN_USERNAME || "";
  const adminPassword = process.env.PORTFOLIO_ADMIN_PASSWORD || "";
  const sessionSecret = process.env.PORTFOLIO_ADMIN_SESSION_SECRET || "";

  function isAuthenticated(req) {
    const cookies = parseCookies(req.headers.cookie);
    return verifySessionCookie(cookies[COOKIE_NAME], sessionSecret);
  }

  function requireAuth(req, res) {
    if (isAuthenticated(req)) return true;
    if (req.url?.startsWith("/__portfolio_admin")) {
      sendJson(res, 401, { ok: false, error: "unauthorized" });
    } else {
      redirect(res, "/admin/login");
    }
    return false;
  }

  return {
    name: "portfolio-admin-auth",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || "/", "http://portfolio.local");

        if (url.pathname === "/admin/login" && req.method === "GET") {
          if (isAuthenticated(req)) {
            redirect(res, "/?admin=1");
            return;
          }
          sendLoginPage(res);
          return;
        }

        if (url.pathname === "/admin/login" && req.method === "POST") {
          const body = await readBody(req);
          const params = new URLSearchParams(body);
          const username = params.get("username") || "";
          const password = params.get("password") || "";
          if (
            adminUsername &&
            adminPassword &&
            sessionSecret &&
            safeEqual(username, adminUsername) &&
            safeEqual(password, adminPassword)
          ) {
            setSession(res, sessionSecret);
            redirect(res, "/?admin=1");
            return;
          }
          sendLoginPage(res, true);
          return;
        }

        if (url.pathname === "/admin/logout" && req.method === "POST") {
          clearSession(res);
          redirect(res, "/admin/login");
          return;
        }

        if (url.pathname === "/admin/status") {
          sendJson(res, 200, { ok: true, authenticated: isAuthenticated(req) });
          return;
        }

        if (url.pathname === "/__portfolio_admin/text-edit" && req.method === "POST") {
          if (!requireAuth(req, res)) return;
          try {
            const body = await readBody(req);
            const payload = JSON.parse(body);
            const result = writeTextEdit(payload);
            sendJson(res, result.ok ? 200 : result.status, result);
          } catch (error) {
            sendJson(res, 400, { ok: false, error: "invalid_request" });
          }
          return;
        }

        if (url.pathname === "/admin") {
          if (!requireAuth(req, res)) return;
          sendAdminHome(res);
          return;
        }

        if (url.pathname.startsWith("/__portfolio_admin")) {
          if (!requireAuth(req, res)) return;
        }

        next();
      });
    },
  };
}
