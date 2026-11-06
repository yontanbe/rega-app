import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TOPICS, topic as findTopic } from "@/lib/guided";
import TopicSession from "@/components/TopicSession";

export const dynamicParams = false;

export function generateStaticParams() {
  return TOPICS.map((t) => ({ topic: t.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> {
  const t = findTopic((await params).topic);
  return { title: t ? `${t.title} | רגע` : "רגע", description: t?.subtitle };
}

export default async function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const t = findTopic((await params).topic);
  if (!t) notFound();
  return <TopicSession topicId={t.id} />;
}
