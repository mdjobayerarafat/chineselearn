import ChapterDetail from "./ChapterDetail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ChapterDetail id={id} />;
}
