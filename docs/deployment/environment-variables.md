# Environment Variables Documentation

คู่มือนี้อธิบาย environment variables ทั้งหมดที่ใช้ในแอปพลิเคชัน CRM Bank

## Required Variables

### Database

#### `DATABASE_URL`

- **Type:** String (Connection URL)
- **Required:** ✅ Yes
- **Description:** PostgreSQL database connection string
- **Format:** `postgresql://[user]:[password]@[host]:[port]/[database]`
- **Examples:**

  ```env
  # Local development
  DATABASE_URL="postgresql://postgres:postgres@localhost:5432/crm_bank"

  # Production (external database)
  DATABASE_URL="postgresql://crm_user:SecurePass123@192.168.1.50:5432/crm_bank"

  # With connection pooling
  DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20"
  ```

### Authentication

#### `AUTH_SECRET`

- **Type:** String (Base64)
- **Required:** ✅ Yes
- **Description:** Secret key สำหรับ NextAuth.js session encryption
- **Security:** ⚠️ **CRITICAL** - ต้องเป็นค่าที่ปลอดภัยและไม่ซ้ำกัน
- **Generate:**

  ```bash
  # Linux/Mac
  openssl rand -base64 32

  # Windows PowerShell
  [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
  ```

- **Example:**
  ```env
  AUTH_SECRET="Xk7mP9qR2sT4vW6yZ8aB1cD3eF5gH7iJ9kL0mN2oP4qR6sT8uV0wX2yZ4aB6cD8e"
  ```

#### `AUTH_TRUST_HOST`

- **Type:** Boolean String
- **Required:** ✅ Yes (for production)
- **Description:** อนุญาตให้ NextAuth.js trust proxy headers
- **Default:** `"false"`
- **Production:** `"true"`
- **Example:**
  ```env
  AUTH_TRUST_HOST="true"
  ```

#### `NEXTAUTH_URL`

- **Type:** String (URL)
- **Required:** ✅ Yes (for production)
- **Description:** Base URL ของแอปพลิเคชัน
- **Examples:**

  ```env
  # Development
  NEXTAUTH_URL="http://localhost:3000"

  # Production with ngrok
  NEXTAUTH_URL="https://abc123.ngrok.io"

  # Production with domain
  NEXTAUTH_URL="https://crm.yourdomain.com"
  ```

### Cloudinary (File Storage)

#### `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`

- **Type:** String
- **Required:** ✅ Yes
- **Description:** Cloudinary cloud name
- **Public:** ✅ Yes (accessible in browser)
- **Example:**
  ```env
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
  ```

#### `CLOUDINARY_API_KEY`

- **Type:** String
- **Required:** ✅ Yes
- **Description:** Cloudinary API key
- **Security:** ⚠️ Server-side only
- **Example:**
  ```env
  CLOUDINARY_API_KEY="123456789012345"
  ```

#### `CLOUDINARY_API_SECRET`

- **Type:** String
- **Required:** ✅ Yes
- **Description:** Cloudinary API secret
- **Security:** ⚠️ **CRITICAL** - Server-side only
- **Example:**
  ```env
  CLOUDINARY_API_SECRET="abcdefghijklmnopqrstuvwxyz123456"
  ```

## Optional Variables

### Application

#### `NODE_ENV`

- **Type:** String (Enum)
- **Required:** ❌ No
- **Description:** Node.js environment
- **Values:** `"development"`, `"production"`, `"test"`
- **Default:** `"development"`
- **Example:**
  ```env
  NODE_ENV="production"
  ```

#### `NEXT_PUBLIC_SHOW_RANDOM_FILL`

- **Type:** Boolean String
- **Required:** ❌ No
- **Description:** แสดงปุ่ม "Random Fill" สำหรับทดสอบ
- **Default:** `"false"`
- **Development:** `"true"`
- **Production:** `"false"`
- **Example:**
  ```env
  NEXT_PUBLIC_SHOW_RANDOM_FILL="true"
  ```

### Performance

#### `NEXT_TELEMETRY_DISABLED`

- **Type:** Boolean String
- **Required:** ❌ No
- **Description:** ปิด Next.js telemetry
- **Default:** `"0"`
- **Example:**
  ```env
  NEXT_TELEMETRY_DISABLED="1"
  ```

## Environment-Specific Configurations

### Development (`.env.local`)

```env
# Database - Local PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/crm_bank"

# Authentication
AUTH_SECRET="dev-secret-key-change-in-production"
AUTH_TRUST_HOST="true"

# Application
NEXT_PUBLIC_SHOW_RANDOM_FILL="true"

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-dev-cloud"
CLOUDINARY_API_KEY="dev-api-key"
CLOUDINARY_API_SECRET="dev-api-secret"
```

### Local Docker Testing (`.env.local`)

```env
# Database - Docker PostgreSQL container
# Note: DATABASE_URL will be overridden in docker-compose.yml
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/crm_bank"

# Authentication
AUTH_SECRET="test-secret-key"
AUTH_TRUST_HOST="true"

# Application
NEXT_PUBLIC_SHOW_RANDOM_FILL="true"

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### Production (`.env.production`)

```env
# Database - External PostgreSQL
DATABASE_URL="postgresql://crm_user:SecurePassword123@192.168.1.50:5432/crm_bank"

# Authentication - MUST generate new secure values
AUTH_SECRET="<generate-with-openssl-rand-base64-32>"
AUTH_TRUST_HOST="true"
NEXTAUTH_URL="https://crm.yourdomain.com"

# Application
NODE_ENV="production"
NEXT_PUBLIC_SHOW_RANDOM_FILL="false"

# Cloudinary - Production credentials
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-prod-cloud"
CLOUDINARY_API_KEY="prod-api-key"
CLOUDINARY_API_SECRET="prod-api-secret"

# Performance
NEXT_TELEMETRY_DISABLED="1"
```

## Security Best Practices

### 🔒 Critical Security Rules

1. **Never commit `.env` files to Git**

   - ✅ `.env.local` - Ignored by default
   - ✅ `.env.production` - Ignored by default
   - ✅ `.env.production.example` - Safe to commit (no real values)

2. **Use different secrets for each environment**

   - ❌ Don't reuse `AUTH_SECRET` across environments
   - ❌ Don't use development credentials in production

3. **Rotate secrets regularly**

   - 🔄 Change `AUTH_SECRET` every 90 days
   - 🔄 Rotate database passwords periodically

4. **Limit access to production secrets**
   - 👤 Only authorized personnel
   - 📝 Document who has access
   - 🔐 Use secret management tools (e.g., HashiCorp Vault)

### 🚫 Common Mistakes to Avoid

1. ❌ **Hardcoding secrets in code**

   ```typescript
   // BAD
   const apiKey = "abc123";

   // GOOD
   const apiKey = process.env.CLOUDINARY_API_KEY;
   ```

2. ❌ **Exposing server-side secrets to client**

   ```typescript
   // BAD - Don't use NEXT_PUBLIC_ for secrets
   NEXT_PUBLIC_DATABASE_URL = "...";

   // GOOD - Server-side only
   DATABASE_URL = "...";
   ```

3. ❌ **Using weak secrets**

   ```env
   # BAD
   AUTH_SECRET="123456"

   # GOOD
   AUTH_SECRET="Xk7mP9qR2sT4vW6yZ8aB1cD3eF5gH7iJ9kL0mN2oP4qR6sT8uV0wX2yZ4aB6cD8e"
   ```

## Validation Checklist

Before deploying, verify:

- [ ] ✅ All required variables are set
- [ ] ✅ `DATABASE_URL` is correct and accessible
- [ ] ✅ `AUTH_SECRET` is strong and unique
- [ ] ✅ `NEXTAUTH_URL` matches your domain
- [ ] ✅ Cloudinary credentials are correct
- [ ] ✅ No development values in production
- [ ] ✅ No secrets committed to Git
- [ ] ✅ `.env.production` has correct permissions (read-only)

## Testing Environment Variables

### Test Database Connection

```bash
# Using Prisma
npx prisma db pull

# Using psql
psql "$DATABASE_URL" -c "SELECT version();"
```

### Test Cloudinary Connection

```bash
# Using curl
curl -u "$CLOUDINARY_API_KEY:$CLOUDINARY_API_SECRET" \
  "https://api.cloudinary.com/v1_1/$NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME/resources/image"
```

### Test Application

```bash
# Start application
npm run dev

# Check health endpoint
curl http://localhost:3000/api/health
```

## Troubleshooting

### Issue: "Invalid DATABASE_URL"

**Cause:** Incorrect connection string format

**Solution:**

```env
# Check format
postgresql://[user]:[password]@[host]:[port]/[database]

# Ensure special characters in password are URL-encoded
# Example: password with @ becomes %40
DATABASE_URL="postgresql://user:p%40ssword@host:5432/db"
```

### Issue: "AUTH_SECRET is not set"

**Cause:** Missing or empty `AUTH_SECRET`

**Solution:**

```bash
# Generate new secret
openssl rand -base64 32

# Add to .env.production
AUTH_SECRET="<generated-value>"
```

### Issue: "Cloudinary upload failed"

**Cause:** Invalid Cloudinary credentials

**Solution:**

1. Verify credentials in Cloudinary dashboard
2. Check that `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` matches exactly
3. Ensure `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` are correct
4. Test with curl command above

## References

- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)
- [Prisma Connection URLs](https://www.prisma.io/docs/reference/database-reference/connection-urls)
- [Cloudinary API](https://cloudinary.com/documentation/cloudinary_sdks)
