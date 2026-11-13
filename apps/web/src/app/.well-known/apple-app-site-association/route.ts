/**
 * iOS Universal Links for the ApplyFields app. IOS_APP_ID = "<Apple Team ID>.in.applyfields.app".
 * Paths match apps/mobile/app.json (associatedDomains) and lib/deep-link.ts.
 */
export function GET() {
  const appID = process.env.IOS_APP_ID?.trim();
  const paths = ['/jobs/*', '/exams/*', '/scholarships/*', '/admissions/*', '/career/colleges/*', '/services/*'];
  return Response.json(
    { applinks: { details: appID ? [{ appIDs: [appID], components: paths.map((p) => ({ '/': p })) }] : [] } },
    { headers: { 'Cache-Control': 'public, max-age=3600' } },
  );
}
