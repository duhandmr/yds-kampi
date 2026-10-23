import { setQuestionStatusAction } from "@/app/actions/admin";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ButtonVariant } from "@/components/ui/button";
import type { QualityStatusKey } from "@/lib/constants";

export function StatusButton({ id, status, label, back, variant = "secondary" }: { id: string; status: QualityStatusKey; label: string; back: string; variant?: ButtonVariant }) {
  return (
    <form action={setQuestionStatusAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="back" value={back} />
      <SubmitButton size="sm" variant={variant} pendingText="…">
        {label}
      </SubmitButton>
    </form>
  );
}
