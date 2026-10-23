import type { Metadata } from "next";
import { ReviewSession } from "@/components/vocabulary/review-session";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { requireOnboardedUser } from "@/lib/auth/guards";
import { getDueVocabulary } from "@/lib/services/vocabulary";

export const metadata: Metadata = { title: "Kelime tekrarı" };
export const dynamic = "force-dynamic";

export default async function VocabularyReviewPage() {
  const user = await requireOnboardedUser();
  const due = await getDueVocabulary(user.id, 20);
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Kelime tekrarı" description="Kelimeyi hatırlamaya çalış, sonra anlamını göster ve ne kadar iyi hatırladığını işaretle." />
      {due.length === 0 ? (
        <EmptyState title="Şu an tekrar bekleyen kelime yok" action={<ButtonLink href="/kelimeler" variant="secondary">Kelime listeme git</ButtonLink>}>
          Yeni kelimeler denemelerden sonra eklenecek.
        </EmptyState>
      ) : (
        <ReviewSession
          cards={due.map((v) => ({
            id: v.id,
            term: v.term,
            meaningTr: v.meaningTr,
            partOfSpeech: v.partOfSpeech,
            exampleEn: v.exampleEn,
            exampleTr: v.exampleTr,
            synonyms: v.synonyms,
            antonyms: v.antonyms,
          }))}
        />
      )}
    </div>
  );
}
