import { redirect } from "next/navigation";

type LegacyDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export const instant = false;

export default async function LegacyDetailPage({ params }: LegacyDetailPageProps) {
  const { slug } = await params;
  redirect(`/voitures/${slug}`);
}
