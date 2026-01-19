## Local Debug: /api/roles 500

Use this guide to reproduce and diagnose the roles endpoint locally.

### 1) Start backend

```bash
cd /Users/josephc/Documents/Projects/SP/idurar-erp-crm/backend
npm install
npm run dev
```

### 2) Seed roles/permissions (if needed)

```bash
cd /Users/josephc/Documents/Projects/SP/idurar-erp-crm/backend
node src/setup/seedRoles.js
```

### 3) Login and get a token

- Login via the UI, then copy the JWT from localStorage key `auth`.
- Or use an existing admin token.

### 4) Call the roles endpoint directly

```bash
AUTH_TOKEN="paste-jwt-here" API_URL="http://localhost:8888/api" node /Users/josephc/Documents/Projects/SP/idurar-erp-crm/code/debug/roles-check.js
```

### 5) If it returns 404 ("Api url doesn't exist")

- Ensure the backend exposes role routes:
  - `GET /api/roles`
  - `GET /api/roles/list` (compatibility for `request.list`)
- Confirm `backend/src/app.js` mounts `roleRoutes` under `/api`.

### 6) If it still returns 500

Check backend logs for stack traces around:
- `backend/src/controllers/roleController.js`
- `backend/src/middlewares/rbac/checkPermission.js`

Common causes:
- User has no roles assigned (RBAC denies or role population fails)
- Roles/permissions were not seeded
- DB connection errors during role population
