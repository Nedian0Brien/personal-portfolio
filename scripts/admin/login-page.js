export function sendLoginPage(res, failed = false) {
  res.statusCode = failed ? 401 : 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(`<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
<title>Portfolio Admin Login</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Inter+Tight:wght@600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css" />
<style>
*,*::before,*::after{box-sizing:border-box}
:root{
  --font-sans:"Inter","Pretendard Variable",Pretendard,ui-sans-serif,system-ui,-apple-system,sans-serif;
  --font-display:"Inter Tight","Inter","Pretendard Variable",Pretendard,sans-serif;
  --font-mono:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
  --neutral-0:0 0% 100%;--neutral-5:0 0% 96%;--neutral-10:0 0% 93%;--neutral-20:0 0% 86%;--neutral-40:0 0% 68%;--neutral-50:0 0% 53%;--neutral-60:0 0% 44%;--neutral-80:0 0% 25%;--neutral-90:0 0% 15%;--neutral-100:0 0% 8%;
  --blue-10:216 100% 92%;--blue-60:216 100% 52%;--blue-70:216 100% 44%;--red-10:18 100% 92%;--red-60:18 100% 44%;--green-10:150 60% 92%;--green-60:150 70% 32%;--yellow-10:42 100% 90%;--yellow-60:42 100% 42%;
  --bg-primary:hsl(var(--neutral-0));--bg-secondary:hsl(var(--neutral-5));--bg-tertiary:hsl(var(--neutral-10));--bg-inverse:hsl(var(--neutral-100));--bg-brand:hsl(var(--blue-60));--bg-brand-hover:hsl(var(--blue-70));
  --text-primary:hsl(var(--neutral-100));--text-secondary:hsl(var(--neutral-60));--text-tertiary:hsl(var(--neutral-50));--text-inverse:hsl(var(--neutral-0));--text-on-brand:hsl(var(--neutral-0));
  --border-primary:hsl(var(--neutral-10));--border-secondary:hsl(var(--neutral-20));--border-focus:hsl(var(--neutral-100));
  --r-3:6px;--r-4:8px;--r-5:12px;--r-6:16px;--ease:cubic-bezier(.2,.7,.2,1);--dur-1:120ms;--dur-2:220ms;--shadow-lg:0 12px 40px -12px rgba(0,0,0,.18)
}
html,body{margin:0;min-height:100%;-webkit-text-size-adjust:100%}
body{min-height:100vh;background:var(--bg-secondary);color:var(--text-primary);font-family:var(--font-sans);font-size:15px;line-height:1.55;letter-spacing:-0.003em;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
.page{min-height:100vh;display:grid;grid-template-rows:auto 1fr}
.topbar{height:56px;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:0 24px;background:hsla(0 0% 100%/.78);backdrop-filter:saturate(160%) blur(14px);border-bottom:1px solid var(--border-primary)}
.brand{display:inline-flex;align-items:center;gap:10px;font-family:var(--font-display);font-weight:700;font-size:16px;letter-spacing:-0.015em}
.mark{width:24px;height:24px;border-radius:7px;display:inline-flex;align-items:center;justify-content:center;background:var(--bg-inverse);color:var(--text-inverse);font-weight:800;font-size:12px}
.toplink{height:32px;padding:0 12px;display:inline-flex;align-items:center;border:1px solid var(--border-secondary);border-radius:var(--r-4);font-size:13px;font-weight:500;background:transparent}
.toplink:hover{background:var(--bg-primary)}
.shell{width:min(1040px,calc(100vw - 48px));margin:0 auto;padding:56px 0;display:grid;grid-template-columns:minmax(0,1fr) 440px;align-items:stretch}
.intro{min-height:560px;padding:34px;display:flex;flex-direction:column;justify-content:space-between;background:var(--bg-inverse);color:var(--text-inverse);border-radius:var(--r-5) 0 0 var(--r-5);overflow:hidden}
.eyebrow{font-family:var(--font-mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:hsl(var(--neutral-40))}
.headline{margin:18px 0 0;font-family:var(--font-display);font-size:clamp(38px,5vw,64px);line-height:1.02;letter-spacing:0;font-weight:800;max-width:8.5em}
.summary{max-width:420px;color:hsl(var(--neutral-40));font-family:var(--font-mono);font-size:12px;letter-spacing:.01em;line-height:1.7}
.signals{display:flex;gap:8px;flex-wrap:wrap;margin-top:28px}
.badge{display:inline-flex;align-items:center;height:26px;padding:0 9px;border-radius:var(--r-3);font-size:12px;font-weight:600;background:hsl(var(--neutral-90));color:var(--text-inverse);border:1px solid hsl(var(--neutral-80))}
.badge--blue{background:hsl(var(--blue-10));color:hsl(var(--blue-70));border-color:transparent}
.badge--green{background:hsl(var(--green-10));color:hsl(var(--green-60));border-color:transparent}
.panel{min-height:560px;padding:34px;background:var(--bg-primary);border:1px solid var(--border-primary);border-left:0;border-radius:0 var(--r-5) var(--r-5) 0;display:flex;flex-direction:column;justify-content:center}
.label{font-family:var(--font-mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:10px}
h1{margin:0;font-family:var(--font-display);font-size:32px;line-height:1.1;letter-spacing:0;font-weight:750}
p{margin:10px 0 28px;color:var(--text-secondary);line-height:1.65}
.field{margin-bottom:14px}
label{display:block;margin-bottom:8px;color:var(--text-secondary);font-size:13px;font-weight:600}
input{width:100%;height:44px;border:1px solid var(--border-primary);border-radius:var(--r-4);background:var(--bg-secondary);color:var(--text-primary);padding:0 12px;font:inherit;outline:none;transition:background var(--dur-1) var(--ease),border-color var(--dur-1) var(--ease)}
input:hover{border-color:var(--border-secondary)}
input:focus{background:var(--bg-primary);border-color:var(--border-focus)}
.btn{width:100%;height:44px;margin-top:6px;border:1px solid transparent;border-radius:var(--r-4);background:var(--bg-inverse);color:var(--text-inverse);font:inherit;font-weight:650;cursor:pointer;transition:background var(--dur-1) var(--ease),transform var(--dur-1) var(--ease)}
.btn:hover{background:hsl(var(--neutral-80))}
.btn:active{transform:translateY(1px)}
.error{margin-top:14px;padding:10px 12px;border-radius:var(--r-4);background:hsl(var(--red-10));color:hsl(var(--red-60));font-size:13px;font-weight:600}
.note{margin-top:18px;padding-top:18px;border-top:1px solid var(--border-primary);color:var(--text-tertiary);font-size:13px;line-height:1.55}
@media (max-width:860px){
  .topbar{padding:0 16px}
  .shell{width:min(480px,calc(100vw - 32px));padding:28px 0;grid-template-columns:1fr}
  .intro{min-height:260px;border-radius:var(--r-5) var(--r-5) 0 0;padding:26px}
  .headline{font-size:40px}
  .summary{margin-top:26px}
  .panel{min-height:auto;border-left:1px solid var(--border-primary);border-top:0;border-radius:0 0 var(--r-5) var(--r-5);padding:26px}
}
</style>
</head>
<body>
<div class="page">
  <header class="topbar">
    <a class="brand" href="/">
      <span class="mark">박</span>
      <span>박민재 · Minjae Park</span>
    </a>
    <a class="toplink" href="/">Portfolio</a>
  </header>
  <main class="shell">
    <section class="intro" aria-label="Portfolio admin intro">
      <div>
        <div class="eyebrow">Portfolio Admin</div>
        <div class="headline">Edit with precision.</div>
        <div class="signals">
          <span class="badge badge--blue">Dev mode</span>
          <span class="badge badge--green">React Grab</span>
          <span class="badge">Secure session</span>
        </div>
      </div>
      <p class="summary">portfolio.lawdigest.cloud/admin</p>
    </section>
    <section class="panel" aria-label="Admin login form">
      <div class="label">Authentication</div>
      <h1>관리자 로그인</h1>
      <p>포트폴리오 편집 도구에 접근하려면 관리자 계정으로 로그인하세요.</p>
      <form method="post" action="/admin/login">
        <div class="field">
          <label for="username">Username</label>
          <input id="username" name="username" type="text" autocomplete="username" autofocus required />
        </div>
        <div class="field">
          <label for="password">Password</label>
          <input id="password" name="password" type="password" autocomplete="current-password" required />
        </div>
        <button class="btn" type="submit">Login</button>
      </form>
      ${failed ? '<div class="error">아이디 또는 비밀번호가 올바르지 않습니다.</div>' : ""}
      <div class="note">로그인 세션은 12시간 동안 유지됩니다.</div>
    </section>
  </main>
</div>
</body>
</html>`);
}

