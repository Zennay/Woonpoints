// Web serving liveness only. This endpoint intentionally never interrogates
// account authorization, the database, background workers or external providers.
// A 200 must never be interpreted as live reaction capability or readiness.
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json(
    { service: 'woonpoints-web', status: 'serving' },
    { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
