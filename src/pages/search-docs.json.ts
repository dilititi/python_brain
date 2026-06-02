import { getSearchDocuments } from "../lib/search-index";

export async function GET() {
  const docs = await getSearchDocuments();

  return new Response(JSON.stringify(docs), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate"
    }
  });
}
