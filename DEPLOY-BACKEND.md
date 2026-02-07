# Why MongoDB doesn't get the new key after Vercel redeploy

## Where each part runs

| Platform | What runs there | Writes to MongoDB? |
|----------|-----------------|--------------------|
| **Vercel** | Next.js app (frontend + API routes) | **No** – API routes only proxy requests |
| **Render** | Express backend (`server.js` + `model/employeeForm.js`) | **Yes** – this is the only app that saves to Mongo |

When a user submits the employee form:

1. Browser → **Vercel** (e.g. `https://your-app.vercel.app/api/employeeForm`)
2. Vercel API route → **Render** (`https://axis-precision-app.onrender.com/api/employeeForm`)
3. **Render** runs `server.js`, uses `model/employeeForm.js`, and writes to MongoDB

So redeploying only on **Vercel** does not change how data is saved. The backend that must be updated is on **Render**.

---

## Fix: Redeploy the backend on Render

You need to deploy the **same repo** (with the updated `model/employeeForm.js`) to **Render**, so the running backend uses the schema that includes `internalJobOrder`.

### Option A: Render is already connected to your Git repo

1. Push your latest code (with the fixed `model/employeeForm.js`) to the branch Render deploys from (e.g. `main` or `master`).
2. In [Render Dashboard](https://dashboard.render.com) → your **Web Service** (axis-precision-app) → **Manual Deploy** → **Deploy latest commit** (or wait for auto-deploy if enabled).
3. Wait until the deploy finishes and the service is **Live**.
4. Test the form again from the Vercel app; new submissions should have `internalJobOrder` (and other new keys) in MongoDB and in the API response.

### Option B: Render is not using this repo

1. In Render, open your backend service.
2. Connect it to this repo and the correct branch, or update the repo URL if it was pointing elsewhere.
3. Set **Build Command** and **Start Command** so it runs the Express app (e.g. Start: `node server.js` or `npm start` if that runs `server.js`).
4. Save and trigger a **Manual Deploy**.
5. After deploy, test again from the Vercel app.

### Option C: You're not sure what Render is running

1. In Render Dashboard, open the service that hosts `axis-precision-app.onrender.com`.
2. Check **Settings** → which **Repository** and **Branch** it deploys from.
3. Ensure that repo/branch contains the updated `model/employeeForm.js` (with `internalJobOrder` and the safe export).
4. Trigger a new deploy and retest.

---

## Quick check after Render redeploy

1. Open a recent employee form document in MongoDB (Compass or Atlas UI).
2. Confirm the document has an `internalJobOrder` field.
3. Or submit a new entry from the Vercel app and check the API response; it should include `internalJobOrder`.

---

## Summary

- **Vercel redeploy** = updates frontend and proxy only → does **not** change what gets saved to Mongo.
- **Render redeploy** = updates the app that uses `model/employeeForm.js` and writes to Mongo → **this** is what fixes the missing `internalJobOrder` in production.

Redeploy the **Render** backend (with the latest code) and MongoDB will start saving and returning the new key.

---

## "Response has the new entry but Mongo shows no records"

If the **API response** includes the new document (with `internalJobOrder`, `_id`, etc.) but you **don’t see that document in MongoDB**, the usual cause is **two different databases**:

- **server.js** tries **MongoDB Atlas** first, then falls back to **local MongoDB** (`localhost:27017`) if Atlas fails (e.g. network, IP not whitelisted).
- So when you run the backend **locally**, it may be connected to **local** MongoDB. New entries are then saved to **local** `login-app-db`, not to **Atlas**.
- If you open **MongoDB Atlas** (or Compass pointing at Atlas), you won’t see those records because they are in **local** Mongo.

**What to do:**

1. **Check server logs** when the backend starts. You should see either:
   - `Connected successfully to MongoDB Atlas (cloud). New employee entries will be saved HERE.`  
   - or `Connected to LOCAL MongoDB (localhost:27017). New employee entries will be saved HERE — not in Atlas.`
2. After each save you’ll see: `Saved to MongoDB: Atlas (cloud)` or `Saved to MongoDB: LOCAL (localhost:27017)` plus `database: login-app-db`, `collection: employeeForm`.
3. If it says **LOCAL**, look at the **same** place for data:
   - Open **MongoDB Compass** (or similar) and connect to **localhost:27017** → database **login-app-db** → collection **employeeForm**.
4. If you want all data in **Atlas**, fix the Atlas connection (e.g. whitelist IP, correct URI) so the server does **not** fall back to local. Then restart the backend and save again; new entries will go to Atlas.
