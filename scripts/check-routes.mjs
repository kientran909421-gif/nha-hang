const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const routes = [
  "/",
  "/thuc-don",
  "/lien-he",
  "/dat-ban",
  "/dat-ban/quan-ly",
  "/dang-nhap",
  "/tai-khoan",
  "/admin",
  "/admin/login",
  "/admin/thuc-don",
  "/admin/noi-dung",
  "/admin/dat-ban",
  "/admin/tai-khoan",
  "/admin/nhan-vien",
  "/admin/master",
];

let failed = false;
for (const route of routes) {
  try {
    const response = await fetch(`${baseUrl}${route}`, { redirect: "manual" });
    console.log(`${response.status} ${route}`);
    if (response.status >= 500) failed = true;
  } catch (error) {
    failed = true;
    console.error(`ERROR ${route}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failed) process.exitCode = 1;
