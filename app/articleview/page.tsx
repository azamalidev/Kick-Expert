import { redirect } from "next/navigation";

export default async function ArticleViewPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await searchParams;

  if (id) {
    redirect(`/articleview/${id}`);
  }

  redirect("/");
}
