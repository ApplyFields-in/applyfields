# 🌐 ApplyFields Live Deployment URLs

| Service | Platform | Environment | Live URL |
|---|---|---|---|
| **Citizen & Student Web** (`apps/web`) | Vercel | Production | [https://applyfields.com](https://applyfields.com) (or `applyfields-web-two.vercel.app`) |
| **Citizen Services & Booking Hub** (`apps/service`) | Vercel | Production | [https://applyfields-4alm.vercel.app](https://applyfields-4alm.vercel.app) (or `service.applyfields.in`) |
| **Dedicated Partner Portal** (`apps/partner`) | Vercel | Production | [https://applyfields.vercel.app](https://applyfields.vercel.app) (or `partners.applyfields.com`) |
| **Internal Admin Portal** (`apps/admin`) | Vercel | Production | [https://applyfields-admin.vercel.app](https://applyfields-admin.vercel.app) |
| **Core API Backend** (`apps/api`) | Render | Production | [https://applyfields.onrender.com](https://applyfields.onrender.com) |
| **API Health Check** | Render | Production | [https://applyfields.onrender.com/api/v1/health](https://applyfields.onrender.com/api/v1/health) |
| **Ingestion & Scrapers** (`apps/ingestion`) | Render | Production | [https://applyfields-1.onrender.com](https://applyfields-1.onrender.com) (Health: [/health](https://applyfields-1.onrender.com/health)) |
| **Database** | Supabase | Managed Cloud | `db.obvcvcgwzjzsujdczxyj.supabase.co` |

---

### API Configuration
* **Base API Path**: `https://applyfields.onrender.com/api/v1`
* **Allowed CORS Origins**:
  * `https://applyfields.com` / `https://applyfields-web-two.vercel.app` (Port 3000)
  * `https://applyfields-admin.vercel.app` (Port 3001)
  * `https://partners.applyfields.com` (Port 3002)
  * `https://service.applyfields.in` (Port 3003)
  * `http://localhost:3000`
  * `http://localhost:3001`
  * `http://localhost:3002`
  * `http://localhost:3003`
