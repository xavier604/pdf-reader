import { db } from "./schema";

export async function getReadingState(pdfId: string) {
  return db.readingState.get(pdfId);
}

export async function saveReadingState(
  pdfId: string,
  state: { currentPage: number; zoomLevel: number },
): Promise<void> {
  await db.readingState.put({
    pdfId,
    ...state,
    updatedAt: Date.now(),
  });
}
