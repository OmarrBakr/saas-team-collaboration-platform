import { useState } from "react";

export default function useCardAssignees({
  assignees = [],
  setAssignees,
} = {}) {
  const [cardAssigneeDraft, setCardAssigneeDraft] = useState(assignees);
  const [isCardAssigneesOpen, setIsCardAssigneesOpen] = useState(false);
  const openCardAssignees = () => {
    setCardAssigneeDraft(assignees);
    setIsCardAssigneesOpen(true);
  };
  const closeCardAssignees = () => setIsCardAssigneesOpen(false);
  const toggleCardAssignee = (memberId) =>
    setCardAssigneeDraft((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId],
    );
  const saveCardAssignees = () => {
    setAssignees?.(cardAssigneeDraft);
    setIsCardAssigneesOpen(false);
  };
  return {
    cardAssigneeDraft,
    setCardAssigneeDraft,
    isCardAssigneesOpen,
    setIsCardAssigneesOpen,
    openCardAssignees,
    closeCardAssignees,
    toggleCardAssignee,
    toggleCardAssigneeDraft: toggleCardAssignee,
    saveCardAssignees,
  };
}
