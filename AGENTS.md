<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
# Dự án: Website nhà hàng
Stack: Next.js (App Router), TypeScript, Tailwind, shadcn/ui (Base UI, style maia), Supabase.
Quy tắc:
- Mobile-first, giao diện tiếng Việt, tiền tệ định dạng 185.000đ.
- Mỗi lần chỉ làm một tính năng, code gọn, comment ngắn.
- Không tự cài thư viện mới nếu chưa hỏi.
- Validate đầu vào bằng zod. Sau khi sửa chạy `npm run build`.
- Base UI dùng prop `render` thay cho `asChild` của Radix.
- Ưu tiên component trong /components/ui, không tự viết lại nút/modal/tab.
- Biến môi trường: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SECRET_KEY (chỉ dùng ở server, không bao giờ import vào code trình duyệt).
Trang: /, /thuc-don, /dat-ban, /lien-he, /admin