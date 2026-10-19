/**
 * One-off: replace every booking and estimate invite token shorter than 20 characters.
 *
 * Tokens made with Math.random() (10–13 chars) were returned to anyone by GET /api/bookings
 * before commit 739a0b2, so they must be treated as public. The app already refuses tokens
 * shorter than 20 chars; this script gives the affected stays a fresh randomId(24) token so
 * their organisers can share a working link again.
 *
 * Usage (dry run first, then apply):
 *   FIREBASE_SERVICE_ACCOUNT_JSON="$(cat service-account.json)" node scripts/rotate-legacy-invite-tokens.js
 *   FIREBASE_SERVICE_ACCOUNT_JSON="$(cat service-account.json)" node scripts/rotate-legacy-invite-tokens.js --apply
 *
 * Without FIREBASE_SERVICE_ACCOUNT_JSON it runs against the local db-mock.json instead.
 */
const fs = require("fs");
const path = require("path");
const { randomBytes } = require("crypto");

const MIN_TOKEN_LENGTH = 20;
const COLLECTIONS = ["bookings", "estimates"];
const apply = process.argv.includes("--apply");

const newToken = () => randomBytes(24).toString("base64url");
const isLegacy = (token) => typeof token !== "string" || token.length < MIN_TOKEN_LENGTH;

async function rotateFirestore(raw) {
  const admin = require("firebase-admin");
  const { getFirestore } = require("firebase-admin/firestore");
  const credentials = JSON.parse(raw.trim());
  admin.initializeApp({ credential: admin.cert(credentials), projectId: credentials.project_id });
  const db = getFirestore();
  console.log(`Firestore project: ${credentials.project_id}`);

  for (const collection of COLLECTIONS) {
    const snap = await db.collection(collection).get();
    const stale = snap.docs.filter((doc) => isLegacy(doc.data().token));
    console.log(`${collection}: ${stale.length} of ${snap.size} need a new token`);
    if (!apply) continue;

    // Firestore batches hold at most 500 writes.
    for (let i = 0; i < stale.length; i += 400) {
      const batch = db.batch();
      for (const doc of stale.slice(i, i + 400)) {
        batch.update(doc.ref, { token: newToken(), tokenRotatedAt: new Date().toISOString() });
      }
      await batch.commit();
    }
    console.log(`${collection}: rotated ${stale.length}`);
  }
}

function rotateMockDb() {
  const mockDbPath = path.join(__dirname, "../db-mock.json");
  if (!fs.existsSync(mockDbPath)) {
    console.error(`No FIREBASE_SERVICE_ACCOUNT_JSON and no mock DB at ${mockDbPath}.`);
    process.exit(1);
  }
  console.log(`Mock DB: ${mockDbPath}`);
  const data = JSON.parse(fs.readFileSync(mockDbPath, "utf8"));
  for (const collection of COLLECTIONS) {
    const records = data[collection] || [];
    const stale = records.filter((r) => isLegacy(r.token));
    console.log(`${collection}: ${stale.length} of ${records.length} need a new token`);
    if (!apply) continue;
    for (const r of stale) {
      r.token = newToken();
      r.tokenRotatedAt = new Date().toISOString();
    }
  }
  if (apply) fs.writeFileSync(mockDbPath, JSON.stringify(data, null, 2), "utf8");
}

(async () => {
  console.log(apply ? "Rotating legacy invite tokens..." : "Dry run (pass --apply to write changes).");
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw) await rotateFirestore(raw);
  else rotateMockDb();
  console.log("Done.");
})().catch((err) => {
  console.error("Token rotation failed:", err);
  process.exit(1);
});
