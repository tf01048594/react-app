# PowerEgg-Wiki Backend Architecture

> Tài liệu mô tả kiến trúc Backend của PowerEgg-Wiki.
>
> Mục tiêu của tài liệu là giúp hiểu **Backend hoạt động như thế nào**, tại sao cần từng thành phần và các thành phần liên kết với nhau ra sao.

---

# 1. Tổng quan

PowerEgg-Wiki sử dụng kiến trúc:

```text
Frontend
React + TypeScript + Vite
        │
        │ HTTP / JSON
        ▼
Backend
Node.js + Express + TypeScript
        │
        ▼
Prisma
        │
        ▼
PostgreSQL
```

Backend chịu trách nhiệm:

- Nhận request từ Frontend
- Kiểm tra request
- Xác thực dữ liệu
- Xử lý business logic
- Đọc/ghi database
- Trả response cho Frontend
- Xử lý lỗi
- Xác thực người dùng
- Phân quyền
- Logging
- Bảo vệ API
- Quản lý cấu trúc database thông qua migration

---

# 2. Kiến trúc tổng thể

Kiến trúc hiện tại:

```text
┌─────────────────────────────┐
│          Browser            │
│                             │
│ React + TypeScript + Vite   │
└──────────────┬──────────────┘
               │
               │ HTTP / JSON
               ▼
┌─────────────────────────────┐
│          Express            │
│                             │
│ CORS                        │
│ Authentication              │
│ Authorization               │
│ Route                       │
│ Validator                   │
│ Controller                  │
│ Service                     │
│ Error Middleware            │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│           Prisma            │
│                             │
│ Prisma Client               │
│ Prisma Adapter              │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│        PostgreSQL           │
│                             │
│ Tables                      │
│ Indexes                     │
│ Constraints                 │
│ Data                        │
└─────────────────────────────┘
```

---

# 3. Ba luồng quan trọng

Một trong những điều quan trọng nhất khi học Backend là phân biệt các luồng khác nhau.

Không phải tất cả thành phần trong project đều nằm trên cùng một đường đi.

Có ba luồng chính:

## 3.1. Request Flow

Đây là luồng khi Client gọi API.

```text
Client
  ↓
CORS
  ↓
Authentication
  ↓
Authorization
  ↓
Route
  ↓
Validator
  ↓
Controller
  ↓
Service
  ↓
Prisma
  ↓
PostgreSQL
```

Sau khi database trả dữ liệu:

```text
PostgreSQL
  ↓
Prisma
  ↓
Service
  ↓
Controller
  ↓
Response
  ↓
Client
```

---

## 3.2. Error Flow

Error không đi tiếp xuống PostgreSQL.

Nếu xảy ra lỗi:

```text
Route
  ↓
Validator
  ↓
Controller
  ↓
Service
  ↓
Prisma
  ↓
ERROR
  ↓
Error Middleware
  ↓
HTTP Response
  ↓
Client
```

Ví dụ:

```text
Client gửi name = ""
        ↓
Validator
        ↓
ZodError
        ↓
Error Middleware
        ↓
HTTP 400
```

---

## 3.3. Database Development Flow

Migration là một luồng khác.

```text
Prisma Schema
      ↓
Migration
      ↓
PostgreSQL
```

Ví dụ:

```prisma
model Setting {
  id   Int    @id @default(autoincrement())
  name String
}
```

Sau đó chạy:

```bash
npx prisma migrate dev --name init
```

Prisma tạo migration và cập nhật PostgreSQL.

Migration không phải là:

```text
Client
 ↓
Controller
 ↓
Service
 ↓
Migration
 ↓
PostgreSQL
```

Migration dùng để **thay đổi cấu trúc database trong quá trình phát triển/deploy**.

---

# 4. Folder Structure

Backend hiện tại có cấu trúc:

```text
backend/
│
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── src/
│   │
│   ├── controllers/
│   │   ├── hello.controller.ts
│   │   └── setting.controller.ts
│   │
│   ├── services/
│   │   ├── hello.service.ts
│   │   └── setting.service.ts
│   │
│   ├── routes/
│   │   ├── hello.route.ts
│   │   └── setting.route.ts
│   │
│   ├── validators/
│   │   └── setting.validator.ts
│   │
│   ├── middlewares/
│   │   └── error.middleware.ts
│   │
│   ├── lib/
│   │   └── prisma.ts
│   │
│   ├── generated/
│   │   └── prisma/
│   │
│   └── app.ts
│
├── .env
├── .env.example
├── package.json
├── package-lock.json
├── prisma.config.ts
└── tsconfig.json
```

---

# 5. `app.ts`

`app.ts` là nơi khởi tạo Express application.

Ví dụ:

```ts
import "dotenv/config";
import express from "express";
import cors from "cors";

import helloRouter from "./routes/hello.route.js";
import settingRouter from "./routes/setting.route.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

const app = express();

const PORT = 3000;

app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json());

app.use("/api/hello", helloRouter);
app.use("/api/settings", settingRouter);

app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
```

`app.ts` nên chủ yếu chịu trách nhiệm:

- Khởi tạo Express
- Middleware global
- Register routes
- Register error middleware
- Start server

Không nên nhét business logic vào đây.

---

# 6. HTTP Request

Frontend gửi request tới Backend.

Ví dụ:

```http
GET /api/settings
```

hoặc:

```http
POST /api/settings
Content-Type: application/json
```

Body:

```json
{
  "name": "Ngôn ngữ hệ thống",
  "key": "system.language",
  "value": "vi",
  "description": "Ngôn ngữ mặc định của hệ thống"
}
```

Backend nhận request này và bắt đầu xử lý.

---

# 7. CORS

CORS là cơ chế bảo vệ Browser khi một website gọi API ở origin khác.

Ví dụ:

```text
Frontend
http://localhost:5173

Backend
http://localhost:3000
```

Hai origin khác nhau:

```text
localhost:5173
localhost:3000
```

Do đó Browser áp dụng CORS.

Cấu hình hiện tại:

```ts
app.use(cors({
  origin: "http://localhost:5173"
}));
```

Điều này cho phép frontend:

```text
http://localhost:5173
```

gọi Backend.

## Production

Không nên để:

```ts
app.use(cors({
  origin: "*"
}));
```

nếu API có authentication hoặc dữ liệu private.

Production nên giới hạn origin.

Ví dụ:

```ts
app.use(cors({
  origin: "https://wiki.example.com"
}));
```

Hoặc tốt hơn, nếu Frontend và Backend dùng cùng domain:

```text
https://wiki.example.com
```

và API:

```text
https://wiki.example.com/api
```

thì có thể dùng reverse proxy để giảm vấn đề cross-origin.

---

# 8. Route

Route xác định:

> Request URL nào sẽ được xử lý bởi controller nào?

Ví dụ:

```ts
router.get("/", getSettingsController);
router.post("/", createSettingController);
```

Khi Client gọi:

```http
GET /api/settings
```

Express sẽ tìm:

```ts
app.use("/api/settings", settingRouter);
```

Sau đó route:

```ts
router.get("/", getSettingsController);
```

được gọi.

Kết quả:

```text
GET /api/settings
        ↓
settingRouter
        ↓
getSettingsController
```

---

# 9. REST API

PowerEgg-Wiki sử dụng REST API.

Ví dụ Setting:

```text
GET    /api/settings
POST   /api/settings
GET    /api/settings/:id
PUT    /api/settings/:id
DELETE /api/settings/:id
```

Ý nghĩa:

| Method | URL | Ý nghĩa |
|---|---|---|
| GET | `/api/settings` | Lấy danh sách |
| GET | `/api/settings/1` | Lấy một Setting |
| POST | `/api/settings` | Tạo |
| PUT | `/api/settings/1` | Cập nhật |
| DELETE | `/api/settings/1` | Xóa |

---

# 10. HTTP Status Code

Backend cần trả HTTP status phù hợp.

Một số status quan trọng:

```text
200 OK
```

Request thành công.

```text
201 Created
```

Tạo resource thành công.

```text
204 No Content
```

Thành công nhưng không trả body.

```text
400 Bad Request
```

Request không hợp lệ.

```text
401 Unauthorized
```

Chưa xác thực.

```text
403 Forbidden
```

Đã xác thực nhưng không có quyền.

```text
404 Not Found
```

Không tìm thấy resource.

```text
409 Conflict
```

Xung đột dữ liệu.

Ví dụ duplicate key.

```text
500 Internal Server Error
```

Lỗi server.

---

# 11. Validator

Validator kiểm tra dữ liệu Client gửi lên.

PowerEgg-Wiki sử dụng Zod.

Ví dụ:

```ts
import { z } from "zod";

export const createSettingSchema = z.object({
  name: z.string().min(1),
  key: z.string().min(1),
  value: z.string().optional(),
  description: z.string().optional()
});
```

Client gửi:

```json
{
  "name": "",
  "key": ""
}
```

Validator phát hiện:

```text
name không hợp lệ
key không hợp lệ
```

Không nên để dữ liệu chưa kiểm tra đi thẳng vào database.

---

# 12. Tại sao phải Validate ở Backend?

Frontend cũng có thể validate.

Ví dụ:

```text
React
 ↓
Validation
 ↓
Backend
 ↓
Validation
 ↓
Database
```

Không được chỉ tin Frontend.

Người dùng có thể:

- dùng Postman
- dùng curl
- gọi API trực tiếp
- sửa request
- bỏ qua React hoàn toàn

Do đó Backend luôn phải tự kiểm tra dữ liệu.

---

# 13. Controller

Controller nhận request và trả response.

Ví dụ:

```ts
export async function createSettingController(
  req: Request,
  res: Response
) {
  const data = createSettingSchema.parse(req.body);

  const setting = await createSetting(
    data.name,
    data.key,
    data.value,
    data.description
  );

  res.status(201).json(setting);
}
```

Controller nên làm những việc như:

- đọc `req.params`
- đọc `req.query`
- đọc `req.body`
- gọi validator
- gọi service
- tạo HTTP response

Controller không nên chứa business logic phức tạp.

---

# 14. Service

Service chứa business logic.

Ví dụ:

```ts
export function createSetting(
  name: string,
  key: string,
  value?: string,
  description?: string
) {
  return prisma.setting.create({
    data: {
      name,
      key,
      value,
      description
    }
  });
}
```

Controller:

```text
Nhận HTTP request
```

Service:

```text
Xử lý nghiệp vụ
```

Đây là lý do nên tách hai tầng.

---

# 15. Prisma

Prisma là ORM.

ORM = Object Relational Mapping.

Nó giúp TypeScript/Node.js làm việc với database bằng JavaScript/TypeScript thay vì tự viết SQL cho mọi thao tác.

Ví dụ:

```ts
prisma.setting.findMany()
```

thay vì trực tiếp viết:

```sql
SELECT *
FROM "Setting";
```

---

# 16. Prisma Client

Prisma Client là API TypeScript được generate từ Prisma Schema.

Ví dụ:

```ts
prisma.setting.findMany()
```

```ts
prisma.setting.create(...)
```

```ts
prisma.setting.update(...)
```

```ts
prisma.setting.delete(...)
```

Prisma Client cung cấp:

- Type safety
- Query API
- Mapping giữa TypeScript và database
- Hỗ trợ transaction
- Hỗ trợ relation

---

# 17. Prisma Adapter

Project hiện tại sử dụng:

```text
Prisma Client
      ↓
PrismaPg Adapter
      ↓
pg
      ↓
PostgreSQL
```

Ví dụ:

```ts
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
});

const prisma = new PrismaClient({
  adapter
});

export default prisma;
```

Adapter là lớp kết nối Prisma với PostgreSQL driver.

---

# 18. `prisma.ts`

File:

```text
src/lib/prisma.ts
```

chịu trách nhiệm tạo Prisma Client.

Không nên tạo:

```ts
new PrismaClient(...)
```

ở mọi service.

Thay vào đó tạo một instance dùng chung.

```ts
import prisma from "../lib/prisma.js";
```

Service sử dụng instance này.

---

# 19. PostgreSQL

PostgreSQL là database của PowerEgg-Wiki.

Database hiện tại:

```text
wiki
```

Server:

```text
localhost
```

Port hiện tại:

```text
5433
```

Do PostgreSQL trên máy development đang sử dụng port 5433.

---

# 20. Database URL

File `.env`:

```env
DATABASE_URL="postgresql://username:password@localhost:5433/wiki"
```

Ứng dụng đọc:

```ts
process.env.DATABASE_URL
```

Prisma sử dụng URL này để kết nối PostgreSQL.

---

# 21. `.env`

`.env` chứa configuration.

Ví dụ:

```env
DATABASE_URL="..."
PORT=3000
```

Không commit `.env` vào Git.

`.gitignore`:

```gitignore
.env
.env.*
!.env.example
```

Có thể commit:

```text
.env.example
```

Ví dụ:

```env
DATABASE_URL=
PORT=3000
```

Không chứa password thật.

---

# 22. Vì sao không commit `.env`?

Nếu commit:

```env
DATABASE_URL="postgresql://admin:password@server/wiki"
```

thì password database có thể bị lộ.

Nếu repository sau này public Internet, đây là vấn đề bảo mật nghiêm trọng.

---

# 23. Prisma Schema

File:

```text
prisma/schema.prisma
```

Ví dụ:

```prisma
model Setting {
  id          Int     @id @default(autoincrement())
  name        String
  key         String  @unique
  value       String?
  description String?
}
```

Schema mô tả cấu trúc dữ liệu mà Prisma quản lý.

---

# 24. Model

Model:

```prisma
model Setting
```

tương ứng với một table trong PostgreSQL.

Các field:

```prisma
id
name
key
value
description
```

tương ứng với các column.

---

# 25. Constraint

Ví dụ:

```prisma
key String @unique
```

nghĩa là `key` phải unique.

Không được có:

```text
system.language
system.language
```

hai lần.

Nếu cố tạo duplicate:

```text
PostgreSQL
   ↓
Unique constraint violation
   ↓
Prisma P2002
   ↓
Error Middleware
   ↓
HTTP 409
```

---

# 26. Migration

Migration dùng để quản lý thay đổi database.

Ví dụ ban đầu:

```prisma
model Setting {
  id   Int    @id @default(autoincrement())
  name String
}
```

Sau đó thêm:

```prisma
key String @unique
```

Chạy:

```bash
npx prisma migrate dev --name add-setting-key
```

Prisma tạo migration.

Migration giúp team biết:

```text
Database đã thay đổi như thế nào
```

và có thể áp dụng thay đổi đó ở môi trường khác.

---

# 27. Migration Flow

Development:

```text
Developer
   ↓
schema.prisma
   ↓
prisma migrate dev
   ↓
Migration file
   ↓
PostgreSQL
```

Production:

```text
Git
 ↓
Application deployment
 ↓
prisma migrate deploy
 ↓
PostgreSQL
```

Production không nên tùy tiện chạy:

```bash
npx prisma migrate dev
```

---

# 28. Prisma Commands

## Cài Prisma

```bash
npm install prisma @prisma/client
```

## PostgreSQL adapter

```bash
npm install @prisma/adapter-pg pg
```

## Type definitions

```bash
npm install -D @types/pg
```

## dotenv

```bash
npm install -D dotenv
```

## Khởi tạo Prisma

```bash
npx prisma init
```

## Kiểm tra schema

```bash
npx prisma validate
```

## Format schema

```bash
npx prisma format
```

## Generate Client

```bash
npx prisma generate
```

## Tạo migration trong development

```bash
npx prisma migrate dev --name init
```

## Xem migration status

```bash
npx prisma migrate status
```

## Deploy migration

```bash
npx prisma migrate deploy
```

## Reset database

```bash
npx prisma migrate reset
```

Chỉ dùng trong development.

## Prisma Studio

```bash
npx prisma studio
```

## `db push`

```bash
npx prisma db push
```

Phù hợp cho prototype hoặc thử nghiệm nhanh.

Không nên dùng `db push` làm workflow migration chính của production.

---

# 29. CRUD

CRUD:

```text
Create
Read
Update
Delete
```

Ví dụ Setting.

## Create

```http
POST /api/settings
```

## Read

```http
GET /api/settings
```

## Update

```http
PUT /api/settings/1
```

## Delete

```http
DELETE /api/settings/1
```

---

# 30. Create Setting Flow

Client gửi:

```http
POST /api/settings
```

Body:

```json
{
  "name": "Ngôn ngữ hệ thống",
  "key": "system.language",
  "value": "vi",
  "description": "Ngôn ngữ mặc định"
}
```

Luồng:

```text
React
  ↓
HTTP POST
  ↓
Express
  ↓
Route
  ↓
Validator
  ↓
Controller
  ↓
Service
  ↓
Prisma
  ↓
PostgreSQL
```

PostgreSQL tạo record.

Sau đó:

```text
PostgreSQL
  ↓
Prisma
  ↓
Service
  ↓
Controller
  ↓
JSON Response
  ↓
React
```

---

# 31. Ví dụ Error Flow

Client gửi:

```json
{
  "name": "",
  "key": ""
}
```

Validator:

```text
name invalid
key invalid
```

Zod throw:

```text
ZodError
```

Error Middleware nhận:

```text
ZodError
```

Trả:

```http
400 Bad Request
```

Response:

```json
{
  "message": "Validation failed",
  "errors": []
}
```

---

# 32. Error Middleware

Error middleware:

```ts
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client.js";

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof ZodError) {
    res.status(400).json({
      message: "Validation failed",
      errors: err.issues
    });

    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({
        message: "A record with this value already exists"
      });

      return;
    }

    if (err.code === "P2025") {
      res.status(404).json({
        message: "Record not found"
      });

      return;
    }
  }

  console.error(err);

  res.status(500).json({
    message: "Internal server error"
  });
}
```

Middleware này phải được đăng ký sau routes:

```ts
app.use("/api/settings", settingRouter);

app.use(errorMiddleware);
```

---

# 33. Vì sao Error Middleware ở cuối?

Express xử lý middleware theo thứ tự.

Ví dụ:

```text
app.use(...)
app.use(...)
app.use(...)
app.use(errorMiddleware)
```

Nếu một middleware phía trước throw error:

```text
Controller
   ↓
throw error
   ↓
Error Middleware
```

Error middleware bắt được lỗi.

---

# 34. Async/Await

Database operation là asynchronous.

Ví dụ:

```ts
const setting = await prisma.setting.findMany();
```

`await` chờ Promise hoàn thành.

Controller thường là:

```ts
export async function getSettingsController(
  req: Request,
  res: Response
) {
  const settings = await getSettings();

  res.json(settings);
}
```

---

# 35. Request → Response

Một API request có thể hiểu như sau:

```text
Request
   ↓
Express
   ↓
Route
   ↓
Controller
   ↓
Service
   ↓
Database
   ↓
Service
   ↓
Controller
   ↓
Response
```

Request:

```json
{
  "name": "Ngôn ngữ hệ thống"
}
```

Response:

```json
{
  "id": 1,
  "name": "Ngôn ngữ hệ thống",
  "key": "system.language",
  "value": "vi",
  "description": "Ngôn ngữ mặc định"
}
```

---

# 36. Authentication

Authentication trả lời:

> Người này là ai?

Ví dụ:

```text
User login
   ↓
username/password
   ↓
Backend
   ↓
Verify
   ↓
User authenticated
```

Sau đó hệ thống có thể tạo session hoặc token.

---

# 37. Authorization

Authorization trả lời:

> Người này có quyền làm việc này không?

Ví dụ:

```text
User
 ↓
Authentication
 ↓
User = admin
 ↓
Authorization
 ↓
Có quyền sửa Setting
```

Hoặc:

```text
User
 ↓
Authentication
 ↓
User = viewer
 ↓
Authorization
 ↓
Không được sửa
 ↓
403 Forbidden
```

Authentication và Authorization là hai khái niệm khác nhau.

---

# 38. Request Flow khi có Authentication

Sau này có thể trở thành:

```text
React
 ↓
HTTP Request
 ↓
CORS
 ↓
Authentication
 ↓
Authorization
 ↓
Route
 ↓
Validator
 ↓
Controller
 ↓
Service
 ↓
Prisma
 ↓
PostgreSQL
```

---

# 39. Logging

Backend cần log những thông tin quan trọng.

Ví dụ:

```text
2026-10-01 10:20:15
POST /api/settings
201
120ms
```

Khi có lỗi:

```text
POST /api/settings
500
Database connection failed
```

Logging giúp:

- Debug
- Điều tra lỗi
- Theo dõi performance
- Theo dõi production

Không nên log password hoặc secret.

---

# 40. Transaction

Một số nghiệp vụ cần nhiều database operation nhưng phải thành công hoặc thất bại cùng nhau.

Ví dụ:

```text
Create Software
      ↓
Create Module
      ↓
Create Screen
      ↓
Create Settings
```

Nếu bước cuối thất bại, có thể cần rollback toàn bộ.

Transaction:

```text
BEGIN
 ↓
Operation 1
 ↓
Operation 2
 ↓
Operation 3
 ↓
COMMIT
```

Nếu lỗi:

```text
ROLLBACK
```

Prisma hỗ trợ transaction.

Ví dụ:

```ts
await prisma.$transaction(async (tx) => {
  // database operations
});
```

---

# 41. Pagination

Không nên trả hàng triệu records:

```http
GET /api/settings
```

Nếu database có:

```text
1,000,000 settings
```

thì API không nên trả toàn bộ.

Nên dùng pagination.

Ví dụ:

```http
GET /api/settings?page=1&pageSize=20
```

Backend:

```text
page = 1
pageSize = 20
```

trả:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "total": 1000000
}
```

---

# 42. Filtering

Ví dụ:

```http
GET /api/settings?software=CRM
```

Backend chỉ lấy các Setting phù hợp.

---

# 43. Sorting

Ví dụ:

```http
GET /api/settings?sort=name
```

Hoặc:

```http
GET /api/settings?sort=-createdAt
```

Cần validate query parameters để tránh input không hợp lệ.

---

# 44. Search

Search là tính năng quan trọng của PowerEgg-Wiki.

Ví dụ người dùng tìm:

```text
thiết lập ngôn ngữ hệ thống
```

Có thể tìm được:

```text
Software
  ↓
Module
  ↓
Screen
  ↓
Setting
  ↓
Ngôn ngữ hệ thống
```

Search sẽ phát triển theo nhiều giai đoạn.

## Giai đoạn đầu

PostgreSQL keyword search.

## Giai đoạn sau

PostgreSQL Full Text Search.

## Giai đoạn nâng cao

Vector search / pgvector.

## Giai đoạn AI

Semantic search + RAG.

Không cần xây toàn bộ ngay từ đầu.

---

# 45. Wiki Database và Application Database

PowerEgg-Wiki có thể cần làm việc với dữ liệu từ hệ thống khác.

Cần phân biệt:

```text
Application Database
```

và:

```text
Wiki Database
```

Application DB chứa dữ liệu vận hành của hệ thống gốc.

Wiki DB chứa:

- Documentation
- Notes
- Settings metadata
- Screen information
- Module information
- Search index
- Relationships
- Knowledge

Không nên biến Wiki thành nơi chỉnh sửa trực tiếp database production của hệ thống gốc.

---

# 46. Setting trong PowerEgg-Wiki

Ví dụ:

```text
Software
 └── CRM
      └── Common
           └── System Settings
                ├── Ngôn ngữ
                ├── Timezone
                ├── Date format
                └── ...
```

Database có thể lưu:

```text
Setting
-----------------------------
id
name
key
value
description
```

Một Setting có thể đại diện cho một cấu hình trong hệ thống gốc.

---

# 47. Không tạo một column cho mỗi Setting

Không nên:

```text
settings
--------------------------------
language
timezone
date_format
theme
...
```

vì mỗi Setting mới sẽ yêu cầu thay đổi schema.

Thay vào đó:

```text
settings
--------------------------------
id
name
key
value
description
```

Mỗi Setting là một record.

Ví dụ:

```text
1 | Ngôn ngữ | system.language | vi
2 | Timezone  | system.timezone | Asia/Ho_Chi_Minh
3 | Theme     | system.theme    | dark
```

Cách này dễ mở rộng và dễ search.

---

# 48. Searchable Text

Sau này Setting có thể có:

```text
name
key
value
description
screen name
module name
software name
```

Có thể tạo nội dung search:

```text
CRM Common System Settings Ngôn ngữ system.language
ngôn ngữ mặc định của hệ thống
```

Search engine có thể tìm trên toàn bộ nội dung liên quan.

---

# 49. Type của Setting

Hiện tại:

```prisma
value String?
```

Sau này có thể cần:

```text
string
number
boolean
json
enum
```

Có thể bổ sung:

```text
valueType
```

Ví dụ:

```text
string
number
boolean
json
```

Không nhất thiết phải triển khai ngay.

---

# 50. API Validation

Validation cần kiểm tra:

- required fields
- type
- length
- format
- range
- enum
- query parameters
- path parameters

Ví dụ:

```ts
z.string().min(1)
```

hoặc:

```ts
z.number().int().positive()
```

---

# 51. ID Validation

Ví dụ:

```http
GET /api/settings/abc
```

Trong code:

```ts
Number("abc")
```

sẽ thành:

```text
NaN
```

Do đó cần validate:

```text
id phải là integer
```

Đây là một phần nên bổ sung khi API CRUD hoàn thiện.

---

# 52. Database Security

Production:

```text
Internet
   ↓
Reverse Proxy
   ↓
Backend
   ↓
Private Database
```

Không nên:

```text
Internet
   ↓
PostgreSQL :5432
```

Database không nên public trực tiếp ra Internet.

---

# 53. Database User

Production không nên dùng database superuser cho application.

Nên tạo user riêng:

```text
wiki_app
```

với quyền cần thiết.

---

# 54. Database Backup

Production cần backup.

Ví dụ:

```text
PostgreSQL
    ↓
Backup
    ↓
Storage
```

Backup cần được kiểm tra khả năng restore.

Backup tồn tại nhưng không restore được thì chưa đảm bảo an toàn.

---

# 55. HTTPS

Development:

```text
http://localhost:5173
```

Production:

```text
https://wiki.example.com
```

HTTPS bảo vệ dữ liệu truyền giữa Browser và Server.

Đặc biệt quan trọng khi có:

- Login
- Session
- Token
- Password
- Private Wiki data

---

# 56. Reverse Proxy

Production có thể dùng:

```text
Internet
   ↓
Nginx / IIS / Reverse Proxy
   ↓
Frontend
Backend
```

Ví dụ:

```text
https://wiki.example.com
```

Frontend:

```text
/
```

API:

```text
/api
```

Reverse proxy chuyển:

```text
/api/settings
```

đến Node.js:

```text
localhost:3000/api/settings
```

Điều này giúp Browser không cần gọi:

```text
localhost:3000
```

hay một domain khác.

---

# 57. Frontend và Backend cùng domain

Development:

```text
Frontend:
http://localhost:5173

Backend:
http://localhost:3000
```

Production có thể:

```text
https://wiki.example.com
```

và:

```text
https://wiki.example.com/api
```

Khi đó Frontend gọi:

```ts
fetch("/api/settings")
```

thay vì:

```ts
fetch("http://localhost:3000/api/settings")
```

Đây là mô hình thuận tiện cho production.

---

# 58. Environment Development và Production

Development:

```text
localhost
debug log
development database
HTTP
Vite dev server
tsx watch
```

Production:

```text
domain thật
HTTPS
production database
restricted CORS
authentication
logging
backup
reverse proxy
process manager/container
```

Không nên bê nguyên cấu hình development sang production.

---

# 59. Backend Build

Development:

```bash
npm run dev
```

sử dụng:

```text
tsx watch
```

Production nên build TypeScript:

```bash
npx tsc
```

sau đó chạy JavaScript đã build.

Ví dụ:

```bash
node dist/app.js
```

Cấu hình `outDir` và build structure cần được hoàn thiện khi bắt đầu triển khai production.

---

# 60. Production Migration

Khi deploy:

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npx tsc
node dist/app.js
```

Migration production dùng:

```bash
npx prisma migrate deploy
```

Không dùng workflow development:

```bash
npx prisma migrate dev
```

cho production.

---

# 61. API Versioning

Khi API lớn hơn có thể cần:

```text
/api/v1/settings
```

sau này:

```text
/api/v2/settings
```

Hiện tại chưa cần triển khai nếu project còn nhỏ.

---

# 62. Rate Limiting

Nếu API được public Internet, cần cân nhắc rate limiting.

Ví dụ:

```text
Một IP
 ↓
1000 request / second
```

có thể gây:

- quá tải
- brute force
- abuse

Có thể sử dụng middleware hoặc reverse proxy để giới hạn.

---

# 63. Input Sanitization

Không tin dữ liệu từ Client.

Luôn kiểm tra:

```text
body
query
params
headers
```

Đặc biệt với:

- HTML
- Markdown
- file upload
- URL
- SQL-related input

Prisma giúp tránh nhiều SQL injection khi dùng query API bình thường, nhưng không có nghĩa là có thể bỏ qua validation.

---

# 64. File Upload

Nếu Wiki sau này cho phép:

```text
Upload image
Upload PDF
Upload attachment
```

không nên đơn giản lưu tất cả vào database.

Có thể dùng:

```text
File
 ↓
Object Storage / File Storage
```

Database chỉ lưu:

```text
file_id
filename
mime_type
size
storage_path
```

---

# 65. Logging và Sensitive Data

Không log:

```text
password
JWT secret
DATABASE_URL
API key
session secret
```

Không nên:

```ts
console.log(req.body);
```

nếu body có thể chứa thông tin nhạy cảm.

---

# 66. Separation of Responsibilities

Một nguyên tắc quan trọng:

## Route

```text
URL → Controller
```

## Validator

```text
Input có hợp lệ?
```

## Controller

```text
HTTP request → Service → HTTP response
```

## Service

```text
Business logic
```

## Prisma

```text
Database access
```

## PostgreSQL

```text
Persist data
```

---

# 67. Những điều không nên làm

Không nên:

```ts
router.post("/", async (req, res) => {
  // 200 dòng business logic
  // database query
  // validation
  // xử lý error
});
```

Không nên:

```text
Route
 ↓
PostgreSQL
```

Không nên để Controller chứa toàn bộ business logic.

Không nên để Service xử lý HTTP response:

```ts
res.status(...)
```

Service không nên phụ thuộc Express.

Không nên để Prisma query rải rác khắp Controller.

---

# 68. Service không nên biết Express

Không nên:

```ts
function createSetting(req: Request, res: Response) {
}
```

Service nên độc lập:

```ts
function createSetting(data: CreateSettingInput) {
}
```

Điều này giúp Service có thể được sử dụng bởi:

- REST API
- Background job
- CLI
- Cron job
- Test

---

# 69. Controller không nên biết quá nhiều về Database

Controller:

```ts
const data = schema.parse(req.body);

const result = await createSetting(data);

res.status(201).json(result);
```

Controller không cần biết SQL/Prisma query chi tiết.

---

# 70. Service có thể chứa Business Logic

Ví dụ:

```text
Nếu Setting là system.language
thì value chỉ được:
vi
en
ja
```

Đây là business rule.

Không nhất thiết phải nhét toàn bộ vào Controller.

---

# 71. Database Constraint và Business Validation

Có hai lớp bảo vệ.

Ví dụ:

```text
Validator
    ↓
key không được rỗng
```

Database:

```text
key UNIQUE
```

Validator kiểm tra input.

Database bảo vệ integrity.

Không nên chỉ dựa vào một lớp.

---

# 72. Toàn bộ Request Flow

Ví dụ:

```text
POST /api/settings
```

## Bước 1

Browser gửi:

```json
{
  "name": "Ngôn ngữ hệ thống",
  "key": "system.language",
  "value": "vi"
}
```

## Bước 2

Express nhận request.

## Bước 3

CORS kiểm tra origin.

## Bước 4

Authentication kiểm tra user nếu hệ thống đã có login.

## Bước 5

Authorization kiểm tra quyền.

## Bước 6

Route tìm Controller.

```text
POST /
 ↓
createSettingController
```

## Bước 7

Validator kiểm tra body.

## Bước 8

Controller gọi Service.

## Bước 9

Service gọi Prisma.

## Bước 10

Prisma gửi query tới PostgreSQL.

## Bước 11

PostgreSQL ghi dữ liệu.

## Bước 12

PostgreSQL trả kết quả.

## Bước 13

Prisma chuyển thành JavaScript object.

## Bước 14

Service trả kết quả cho Controller.

## Bước 15

Controller trả JSON.

```http
201 Created
```

## Bước 16

React nhận response.

---

# 73. Toàn bộ Error Flow

Ví dụ duplicate key:

```text
React
 ↓
POST /api/settings
 ↓
Route
 ↓
Validator
 ↓
Controller
 ↓
Service
 ↓
Prisma
 ↓
PostgreSQL
 ↓
UNIQUE violation
 ↓
Prisma P2002
 ↓
Error Middleware
 ↓
HTTP 409
 ↓
React
```

Frontend có thể hiển thị:

```text
Setting key đã tồn tại.
```

---

# 74. Database Development Flow

Khi thêm field:

```text
Developer
 ↓
schema.prisma
 ↓
npx prisma migrate dev
 ↓
Migration generated
 ↓
PostgreSQL updated
 ↓
npx prisma generate
 ↓
Prisma Client updated
```

Sau đó code TypeScript có thể sử dụng field mới.

---

# 75. Development Flow

Khi phát triển tính năng mới:

```text
1. Thiết kế dữ liệu
        ↓
2. Prisma Schema
        ↓
3. Migration
        ↓
4. Validator
        ↓
5. Service
        ↓
6. Controller
        ↓
7. Route
        ↓
8. Test API
        ↓
9. Frontend
```

Không nhất thiết lúc nào cũng phải tuyệt đối theo thứ tự này, nhưng đây là flow dễ hiểu để phát triển.

---

# 76. Testing

Backend sau này nên có:

```text
Unit Test
Integration Test
API Test
```

Ví dụ:

```text
Validator test
Service test
API endpoint test
Database integration test
```

Postman có thể dùng để test API trong giai đoạn hiện tại.

---

# 77. Documentation

API nên được document.

Có thể dùng:

```text
OpenAPI / Swagger
```

để mô tả:

```text
Endpoint
Request
Response
Status code
Authentication
```

Chưa cần triển khai ngay.

---

# 78. Kiến trúc hiện tại của PowerEgg-Wiki

Hiện tại:

```text
                    React
                      │
                      │ HTTP
                      ▼
                  Express
                      │
          ┌───────────┼────────────┐
          │           │            │
        Route      Validator    Middleware
          │
          ▼
      Controller
          │
          ▼
       Service
          │
          ▼
     Prisma Client
          │
          ▼
    PrismaPg Adapter
          │
          ▼
      PostgreSQL
```

---

# 79. Các thành phần không nằm trực tiếp trong Request Flow

Các thành phần sau hỗ trợ hệ thống nhưng không phải bước tuần tự của mỗi request:

```text
Prisma Schema
Migration
.env
Prisma Generate
Database Backup
Deployment
Build
Logging infrastructure
Reverse Proxy
HTTPS
CI/CD
```

Ví dụ:

```text
Prisma Schema
      ↓
Migration
      ↓
PostgreSQL
```

là một development/deployment flow.

Trong khi:

```text
Client
 ↓
Route
 ↓
Controller
 ↓
Service
 ↓
Prisma
 ↓
PostgreSQL
```

là request flow.

---

# 80. Production Architecture

Khi PowerEgg-Wiki được public Internet, kiến trúc có thể phát triển thành:

```text
                         Internet
                            │
                            ▼
                    ┌──────────────┐
                    │ HTTPS / Proxy│
                    │ Nginx / IIS  │
                    └──────┬───────┘
                           │
             ┌─────────────┴─────────────┐
             │                           │
             ▼                           ▼
        React Static                 /api/*
                                      │
                                      ▼
                              Node.js / Express
                                      │
                                      ▼
                                    Prisma
                                      │
                                      ▼
                                 PostgreSQL
                                      │
                                      ▼
                                   Backup
```

Database nên nằm trong private network nếu có thể.

---

# 81. Những thứ cần bổ sung trước Production

Hiện tại project mới ở giai đoạn học/development.

Trước khi public Internet nên bổ sung:

- Authentication
- Authorization
- HTTPS
- Production CORS
- Input validation đầy đủ
- ID validation
- Rate limiting
- Secure headers
- Logging
- Error monitoring
- Database backup
- Database access restriction
- Environment secrets
- Reverse proxy
- Production build
- Migration deployment
- Health check
- Monitoring
- File upload security nếu có
- Audit log nếu cần

---

# 82. Health Check

Có thể có:

```http
GET /api/health
```

Response:

```json
{
  "status": "ok"
}
```

Production monitoring có thể gọi endpoint này để kiểm tra server.

Sau này có thể kiểm tra cả database:

```text
API running
+
Database reachable
```

---

# 83. Graceful Shutdown

Production server cần xử lý shutdown đúng cách.

Ví dụ khi process nhận:

```text
SIGTERM
```

ứng dụng nên:

```text
Stop accepting requests
        ↓
Finish current requests
        ↓
Close database connection
        ↓
Exit
```

Điều này quan trọng khi deploy/restart.

---

# 84. Process Management

Node.js process có thể chạy trực tiếp:

```bash
node dist/app.js
```

Production có thể dùng:

```text
systemd
PM2
Docker
Kubernetes
```

Tùy quy mô hệ thống.

PowerEgg-Wiki hiện chưa cần Kubernetes.

---

# 85. CI/CD

Sau này Git có thể kết hợp CI/CD:

```text
git push
   ↓
CI
   ↓
Install dependencies
   ↓
Run test
   ↓
Build
   ↓
Deploy
   ↓
Migration
   ↓
Restart application
```

Hiện tại chưa cần triển khai ngay.

---

# 86. Security Mindset

Một nguyên tắc quan trọng:

> Không tin bất kỳ dữ liệu nào đến từ Client.

Client có thể gửi:

```text
body
query
params
headers
cookies
files
```

Backend phải kiểm tra.

---

# 87. Nguyên tắc mở rộng

Khi PowerEgg-Wiki lớn lên:

```text
Simple CRUD
    ↓
Business Logic
    ↓
Authentication
    ↓
Authorization
    ↓
Search
    ↓
Full Text Search
    ↓
Vector Search
    ↓
AI / RAG
```

Không nên triển khai tất cả ngay từ đầu.

---

# 88. Kiến trúc mục tiêu của PowerEgg-Wiki

Về lâu dài:

```text
                         ┌───────────────┐
                         │    Browser    │
                         │     React     │
                         └───────┬───────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │ Reverse Proxy │
                         │ HTTPS         │
                         └───────┬───────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │    Express    │
                         ├───────────────┤
                         │ CORS          │
                         │ Auth          │
                         │ Authorization │
                         │ Routes        │
                         │ Validation    │
                         │ Controllers   │
                         │ Services      │
                         └───────┬───────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │    Prisma     │
                         └───────┬───────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
             ┌──────────────┐         ┌──────────────┐
             │ PostgreSQL   │         │ Search       │
             │              │         │              │
             │ Wiki data    │         │ FTS / Vector │
             └──────────────┘         └──────────────┘
```

---

# 89. Tóm tắt kiến trúc cần nhớ

Nếu chỉ cần nhớ một sơ đồ:

```text
CLIENT
  │
  ▼
CORS
  │
  ▼
AUTHENTICATION
  │
  ▼
AUTHORIZATION
  │
  ▼
ROUTE
  │
  ▼
VALIDATOR
  │
  ▼
CONTROLLER
  │
  ▼
SERVICE
  │
  ▼
PRISMA
  │
  ▼
POSTGRESQL
```

Response đi ngược lại:

```text
POSTGRESQL
  ↑
PRISMA
  ↑
SERVICE
  ↑
CONTROLLER
  ↑
CLIENT
```

Lỗi đi sang Error Middleware:

```text
ANY LAYER
    │
    ▼
  ERROR
    │
    ▼
ERROR MIDDLEWARE
    │
    ▼
CLIENT
```

Database schema thay đổi bằng Migration:

```text
PRISMA SCHEMA
      │
      ▼
  MIGRATION
      │
      ▼
 POSTGRESQL
```

Configuration:

```text
.env
 │
 ▼
Node.js / Prisma
 │
 ▼
Application
```

---

# 90. Mental Model

Khi nhìn một API mới trong PowerEgg-Wiki, hãy tự hỏi:

### 1. Client gọi URL nào?

```text
GET /api/settings
```

### 2. Route nào nhận?

```text
setting.route.ts
```

### 3. Validator nào kiểm tra?

```text
setting.validator.ts
```

### 4. Controller nào xử lý HTTP?

```text
setting.controller.ts
```

### 5. Service nào xử lý nghiệp vụ?

```text
setting.service.ts
```

### 6. Prisma query nào được thực hiện?

```ts
prisma.setting.findMany()
```

### 7. PostgreSQL table nào được truy cập?

```text
Setting
```

### 8. Nếu lỗi thì đi đâu?

```text
Error Middleware
```

### 9. Nếu thay đổi database thì làm gì?

```text
Prisma Schema
 ↓
Migration
 ↓
PostgreSQL
```

Đây là mental model quan trọng nhất để đọc Backend.

---

# 91. Kết luận

PowerEgg-Wiki Backend không phải chỉ là:

```text
Express → PostgreSQL
```

Mà là một hệ thống gồm nhiều lớp có trách nhiệm khác nhau.

Request chính:

```text
Client
 ↓
Route
 ↓
Validator
 ↓
Controller
 ↓
Service
 ↓
Prisma
 ↓
PostgreSQL
```

Các thành phần hỗ trợ:

```text
CORS
Authentication
Authorization
Error Middleware
Logging
Environment Variables
Migration
Backup
Deployment
Reverse Proxy
HTTPS
```

Trong đó cần đặc biệt phân biệt:

```text
REQUEST FLOW
Client → Route → Validator → Controller → Service → Prisma → PostgreSQL
```

với:

```text
DATABASE DEVELOPMENT FLOW
Prisma Schema → Migration → PostgreSQL
```

và:

```text
ERROR FLOW
Error → Error Middleware → Client
```

Hiểu được ba luồng này sẽ giúp việc học Express, Prisma và PostgreSQL về sau dễ hơn rất nhiều.