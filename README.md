# Steel Data Hub — FINAL

Steel Specification & Material Database — hệ thống tra cứu, phân biệt và quản lý thép,
nhiều máy tính cùng dùng chung 1 database online, Admin kiểm soát dữ liệu, User chỉ tra cứu.

**Tất cả 12 Phase đã hoàn thành**: Auth, Steel Database, Search/Filter, Detail + Compare + SVG,
Admin CRUD, User Management, Change History/Audit Log, Import/Export Excel, Dashboard Analytics,
Responsive + Dark Mode, Security, Deployment.

---

## MỤC LỤC

1. [Chuẩn bị tài khoản](#1-chuẩn-bị-tài-khoản)
2. [Tạo project Supabase (Database + Storage)](#2-tạo-project-supabase)
3. [Đưa code lên GitHub](#3-đưa-code-lên-github)
4. [Chạy thử ở máy local (khuyến nghị trước khi deploy)](#4-chạy-thử-ở-máy-local)
5. [Deploy lên Vercel](#5-deploy-lên-vercel)
6. [Chạy migration + seed database production](#6-chạy-migration--seed-database-production)
7. [Kiểm tra sau khi deploy](#7-kiểm-tra-sau-khi-deploy)
8. [Cập nhật code sau này](#8-cập-nhật-code-sau-này)
9. [Bảo mật đã áp dụng](#9-bảo-mật-đã-áp-dụng)
10. [Xử lý sự cố thường gặp](#10-xử-lý-sự-cố-thường-gặp)

---

## 1. Chuẩn bị tài khoản

Tạo (miễn phí) các tài khoản sau nếu chưa có:

- **GitHub**: https://github.com/signup
- **Supabase**: https://supabase.com (đăng nhập bằng GitHub cho nhanh)
- **Vercel**: https://vercel.com (đăng nhập bằng GitHub)

---

## 2. Tạo project Supabase

### 2.1. Tạo project

1. Vào https://supabase.com/dashboard → **New Project**.
2. Đặt tên (vd `steel-data-hub`), chọn Region gần Việt Nam nhất (vd Singapore).
3. Đặt **Database Password** thật mạnh → **lưu lại**, sẽ cần dùng ở bước sau.
4. Bấm **Create new project**, đợi 1-2 phút để Supabase khởi tạo.

### 2.2. Lấy connection string cho database

1. Vào **Project Settings** (icon bánh răng) → **Database**.
2. Kéo xuống mục **Connection string**:
   - Chọn tab **Session pooler** (hoặc "Transaction" tùy giao diện) → copy chuỗi, đây sẽ là `DATABASE_URL` (port `6543`, có `?pgbouncer=true`).
   - Chọn tab **Direct connection** → copy chuỗi, đây sẽ là `DIRECT_URL` (port `5432`).
3. Trong cả 2 chuỗi, thay `[YOUR-PASSWORD]` bằng password bạn đặt ở bước 2.1.

### 2.3. Lấy API keys

1. Vào **Project Settings → API**.
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key (bấm "Reveal") → `SUPABASE_SERVICE_ROLE_KEY` — **giữ bí mật tuyệt đối**, không đưa vào code commit, không lộ ra frontend.

### 2.4. Tạo Storage bucket cho ảnh thép

1. Vào **Storage** (menu bên trái) → **New bucket**.
2. Tên bucket: `steel-images` → bật **Public bucket** (để ảnh hiển thị được trực tiếp qua URL) → **Create bucket**.

Vậy là xong phần Supabase. Giữ lại tất cả giá trị vừa copy để dùng ở Bước 3 và 5.

---

## 3. Đưa code lên GitHub

Giải nén file `steel-data-hub-final.zip` bạn vừa tải, mở terminal tại thư mục đó:

```bash
cd steel-data-hub

# Khởi tạo git (nếu chưa có)
git init
git add .
git commit -m "Initial commit: Steel Data Hub"
```

Tạo repo mới trên GitHub:

1. Vào https://github.com/new.
2. Đặt tên repo (vd `steel-data-hub`) → chọn **Private** (khuyến nghị, vì đây là dữ liệu nội bộ công ty) → **Create repository**.
3. GitHub sẽ hiện sẵn lệnh, chạy trong terminal (thay `<username>` bằng username GitHub của bạn):

```bash
git remote add origin https://github.com/<username>/steel-data-hub.git
git branch -M main
git push -u origin main
```

**Lưu ý quan trọng**: file `.gitignore` đã được cấu hình sẵn để **không bao giờ** commit `.env`
(chứa password thật). Kiểm tra lại bằng lệnh `git status` — nếu thấy `.env` xuất hiện trong danh
sách file sẽ commit, dừng lại ngay và kiểm tra `.gitignore`.

---

## 4. Chạy thử ở máy local (khuyến nghị trước khi deploy)

```bash
npm install
cp .env.example .env
```

Mở file `.env` vừa tạo, điền đầy đủ giá trị đã lấy từ Bước 2 (`DATABASE_URL`, `DIRECT_URL`,
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).

Tạo `AUTH_SECRET`:

```bash
openssl rand -base64 32
```
Dán kết quả vào `AUTH_SECRET` trong `.env`.

Đặt `SEED_ADMIN_EMAIL` và `SEED_ADMIN_PASSWORD` là tài khoản Admin đầu tiên bạn muốn tạo
(đổi mật khẩu mặc định trong file, đừng để nguyên).

Chạy migration + seed:

```bash
npx prisma migrate dev --name init
npm run prisma:seed
```

Chạy dev server:

```bash
npm run dev
```

Mở http://localhost:3000/login, đăng nhập bằng
`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`. Nếu vào được Dashboard và thấy 4 loại thép mẫu
trong Steel Database → mọi thứ đã kết nối đúng, có thể deploy.

---

## 5. Deploy lên Vercel

### 5.1. Import project

1. Vào https://vercel.com/new.
2. Chọn **Import Git Repository** → chọn repo `steel-data-hub` vừa push (nếu chưa thấy, bấm
   "Adjust GitHub App Permissions" để cấp quyền cho Vercel truy cập repo).
3. Vercel tự nhận diện đây là project **Next.js** — không cần đổi Build Command / Output Directory.

### 5.2. Khai báo Environment Variables

Trước khi bấm Deploy, mở rộng mục **Environment Variables** và thêm **từng biến một** (copy từ
file `.env` local của bạn, nhưng **KHÔNG** copy nguyên `.env` — thêm thủ công từng dòng):

| Key | Value |
|---|---|
| `DATABASE_URL` | connection pooling string từ Supabase |
| `DIRECT_URL` | direct connection string từ Supabase |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
| `SUPABASE_STORAGE_BUCKET` | `steel-images` |
| `AUTH_SECRET` | chuỗi random đã tạo (có thể tạo chuỗi MỚI riêng cho production) |
| `NEXTAUTH_URL` | để trống lúc này, sẽ điền ở Bước 5.3 sau khi có domain |
| `NEXT_PUBLIC_APP_URL` | để trống lúc này, tương tự |
| `SEED_ADMIN_EMAIL` | email Admin |
| `SEED_ADMIN_PASSWORD` | password Admin mạnh (khác với password local) |

Bấm **Deploy**. Lần deploy đầu có thể báo lỗi liên quan `NEXTAUTH_URL` chưa có — không sao,
xử lý ở bước tiếp theo.

### 5.3. Cập nhật NEXTAUTH_URL sau khi có domain

1. Sau khi deploy xong, Vercel cấp cho bạn 1 domain dạng `https://steel-data-hub-xxxx.vercel.app`.
2. Vào **Project → Settings → Environment Variables**, sửa lại:
   - `NEXTAUTH_URL` = `https://steel-data-hub-xxxx.vercel.app` (domain thật của bạn)
   - `NEXT_PUBLIC_APP_URL` = domain thật của bạn
3. Vào tab **Deployments** → bấm **Redeploy** ở bản deploy mới nhất để áp dụng biến môi trường mới.

*(Nếu sau này gắn domain riêng, ví dụ `steel.congty.com`, lặp lại bước này với domain mới.)*

---

## 6. Chạy migration + seed database production

Database Supabase production hiện đang **trống schema** — cần chạy migration + seed **một lần**
nhắm vào database production. Cách đơn giản nhất: chạy từ máy local, trỏ tạm `.env` sang
database production.

```bash
# Trong thư mục project, mở .env, TẠM THỜI thay DATABASE_URL/DIRECT_URL
# bằng đúng giá trị production bạn đã điền trên Vercel (copy y hệt).

npx prisma migrate deploy   # tạo toàn bộ bảng trên Supabase production
npm run prisma:seed         # tạo Admin đầu tiên + dữ liệu mẫu
```

Sau khi chạy xong, **đổi lại `.env` local về database dev cũ** (nếu bạn dùng project Supabase
riêng cho dev/production) để tránh nhầm lẫn về sau.

> Mẹo: nếu muốn tránh phải đổi qua đổi lại `.env`, có thể tạo file tạm `.env.production.local`
> chỉ dùng cho lệnh migrate/seed rồi xóa đi.

---

## 7. Kiểm tra sau khi deploy

Test đúng theo tinh thần "nhiều máy tính cùng database chung":

1. Mở domain Vercel trên **trình duyệt/máy 1** → đăng nhập bằng tài khoản Admin đã seed.
2. Vào **Settings** → đổi mật khẩu ngay (hệ thống bắt buộc đổi sau lần đăng nhập đầu).
3. Vào **Add Steel**, thêm 1 loại thép mới → Save.
4. Mở domain đó trên **trình duyệt/máy 2** (hoặc điện thoại, hoặc trình duyệt ẩn danh) → đăng
   nhập bằng tài khoản **User** khác (tạo qua User Management) → vào **Steel Database** → xác
   nhận **thấy được** loại thép vừa thêm ở máy 1. Đây là bằng chứng cả 2 máy dùng chung 1
   database Supabase, không phải localStorage riêng từng máy.
5. Từ tài khoản User, thử gọi trực tiếp `DELETE https://<domain>/api/steel/<id>` bằng công cụ
   như Postman/curl → phải nhận về `403 Forbidden` (chứng minh phân quyền được chặn ở backend,
   không chỉ ẩn nút trên giao diện).
6. Thử Import Excel (dùng file tải từ nút Download Template) và Export Excel.
7. Vào Change History → xác nhận các thao tác Add/Edit/Login vừa làm đều được ghi lại.

---

## 8. Cập nhật code sau này

Mỗi khi sửa code, đẩy lên GitHub là Vercel **tự động deploy lại**:

```bash
git add .
git commit -m "Mô tả thay đổi"
git push
```

Nếu thay đổi có sửa `prisma/schema.prisma` (thêm bảng/cột mới), cần chạy thêm một lần:

```bash
npx prisma migrate dev --name mo-ta-thay-doi   # tạo migration mới ở local
git add prisma/migrations
git commit -m "Add migration: mô tả"
git push
```

Sau đó chạy `npx prisma migrate deploy` nhắm vào production (như Bước 6) để áp dụng migration
mới lên Supabase production — Vercel **không** tự chạy migration giúp bạn, cần bạn tự chạy
lệnh này sau mỗi lần đổi schema.

---

## 9. Bảo mật đã áp dụng

- Password hash bằng bcrypt (cost 12), không lưu plain text.
- Session JWT qua NextAuth, hết hạn sau 8 giờ.
- **Mọi** API route Add/Edit/Delete/User Management gọi `requireAdmin()`/`requireUser()` ở
  **server** (`lib/permissions/permissions.ts`) — đã kiểm tra lại toàn bộ 16 route API, không
  route nào bỏ sót. User gọi trực tiếp API vẫn nhận đúng `401`/`403`, không chỉ ẩn nút ở UI.
- Input validate bằng Zod (`lib/validation/steel.ts`) trước khi ghi database.
- Prisma dùng parameterized query → chống SQL Injection theo mặc định.
- Rate limiting cơ bản (`lib/rate-limit.ts`) cho các endpoint nhạy cảm (đổi mật khẩu, tạo mới).
- User không tự đổi được role của chính mình (`app/api/users/[id]/route.ts`).
- Truy cập User Management yêu cầu xác thực lại mật khẩu Admin (Password Gate).
- `SUPABASE_SERVICE_ROLE_KEY` chỉ dùng phía server, không expose ra client.
- `.gitignore` chặn commit `.env` chứa secret thật.

---

## 10. Xử lý sự cố thường gặp

**Lỗi `Environment variable not found: DATABASE_URL` khi deploy**
→ Chưa thêm biến môi trường trên Vercel, hoặc thêm rồi nhưng chưa Redeploy. Vào Settings →
Environment Variables kiểm tra lại, rồi Redeploy.

**Đăng nhập báo lỗi / redirect loop**
→ Thường do `NEXTAUTH_URL` không khớp domain thật, hoặc `AUTH_SECRET` để trống. Kiểm tra lại
Bước 5.3.

**Trang Steel Database trống dù đã seed**
→ Migration/seed có thể đã chạy nhầm vào database dev thay vì production. Kiểm tra `DATABASE_URL`
dùng lúc chạy `prisma migrate deploy`/`prisma:seed` có đúng là connection string Supabase
production (khớp với giá trị đã điền trên Vercel) không.

**Ảnh thép không hiển thị sau khi upload**
→ Kiểm tra bucket `steel-images` trên Supabase Storage đã bật **Public** chưa (Bước 2.4).

**Build lỗi `Module not found` trên Vercel nhưng chạy local vẫn được**
→ Thường do khác biệt hoa/thường chữ cái trong tên file giữa Windows/Mac (không phân biệt) và
Linux (phân biệt) — môi trường Vercel chạy Linux. Kiểm tra tên file import khớp chính xác từng
ký tự với tên file thật trong thư mục.

---

## Cấu trúc thư mục

```
/app
  /(auth)/login
  /(dashboard)
    /dashboard                 Dashboard
    /dashboard/steel           Steel Database
    /dashboard/steel/[id]      Steel Detail
    /dashboard/steel/add       Add Steel — Admin
    /dashboard/steel/[id]/edit Edit Steel — Admin
    /dashboard/compare         Steel Comparison
    /dashboard/categories      Steel Categories
    /dashboard/standards       Standards
    /dashboard/history         Change History
    /dashboard/users           User Management — Admin
    /dashboard/favorites       Favorites
    /dashboard/import-export   Import/Export Excel
    /dashboard/settings        Đổi mật khẩu
  /api/...                     API routes tương ứng, mọi route Admin đều
                                chặn 403 ở backend
/components
  /dashboard   sidebar, header, theme-provider, analytics-charts...
  /steel       steel-table, steel-form, steel-filters, shapes, favorite-button...
  /users       password-gate, user-management-table
  /history     history-filters
  /settings    change-password-form
/lib
  /auth          NextAuth config
  /db            Prisma client singleton
  /permissions   requireUser/requireAdmin
  /validation    Zod schemas
  audit.ts       Ghi change_history
  rate-limit.ts
  excel.ts       Mapping cột Excel <-> field database
/prisma
  schema.prisma  Database schema đầy đủ
  seed.ts        Seed Admin + Standards + Categories + Sample data
```
