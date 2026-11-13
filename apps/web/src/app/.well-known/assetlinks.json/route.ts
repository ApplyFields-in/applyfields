/**
 * Android App Links: lets the ApplyFields app open shared applyfields links directly.
 * ANDROID_APP_SHA256 = the app signing key's SHA-256 fingerprint(s), comma-separated
 * (Play Console → App integrity, or `eas credentials` for EAS-signed builds).
 */
export function GET() {
  const fingerprints = (process.env.ANDROID_APP_SHA256 ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const body = fingerprints.length
    ? [
        {
          relation: ['delegate_permission/common.handle_all_urls'],
          target: { namespace: 'android_app', package_name: 'in.applyfields.app', sha256_cert_fingerprints: fingerprints },
        },
      ]
    : [];
  return Response.json(body, { headers: { 'Cache-Control': 'public, max-age=3600' } });
}
