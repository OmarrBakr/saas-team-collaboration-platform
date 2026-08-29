import BoardEditModal from "./BoardEditModal";
import BoardDangerModal from "./BoardDangerModal";
import ListCreateModal from "./ListCreateModal";
import ListEditModal from "./ListEditModal";
import ListDangerModal from "./ListDangerModal";
import CardCreateModal from "./CardCreateModal";
import CardDetailModal from "./CardDetailModal";
import CardAssigneesModal from "./CardAssigneesModal";
import CardDangerModal from "./CardDangerModal";
import BoardViewersModal from "./BoardViewersModal";

export default function BoardModals({ state, actions }) {
  const {
    isEditOpen,
    editForm,
    isEditingBoard,
    editError,
    hasBoardEditChanges,
    isDeletingOpen,
    isDeletingBoard,
    deleteError,
    isListOpen,
    listForm,
    isCreatingList,
    listError,
    isListEditOpen,
    isEditingList,
    hasListEditChanges,
    isListDeletingOpen,
    isDeletingList,
    activeList,
    isCardOpen,
    cardForm,
    isCreatingCard,
    activeCard,
    isCardDetailOpen,
    isEditingCard,
    cardDetailForm,
    cardError,
    attachmentError,
    workspaceMembers,
    isUploadingAttachment,
    labelDraft,
    hasCardDetailChanges,
    isCardAssigneesOpen,
    cardAssigneeDraft,
    isCardDeletingOpen,
    isDeletingCard,
    isBoardViewersOpen,
    onlineBoardMemberIds,
    isAdmin,
  } = state;
  return (
    <>
      <BoardEditModal
        isOpen={isEditOpen}
        form={editForm}
        onChange={actions.handleEditChange}
        onSubmit={actions.handleEditSubmit}
        onClose={() => actions.setIsEditOpen(false)}
        isSubmitting={isEditingBoard}
        error={editError}
        hasChanges={hasBoardEditChanges}
      />
      <BoardDangerModal
        isOpen={isDeletingOpen}
        isSubmitting={isDeletingBoard}
        error={deleteError}
        onClose={() => actions.setIsDeletingOpen(false)}
        onConfirm={actions.handleDeleteBoard}
      />
      <ListCreateModal
        isOpen={isListOpen}
        form={listForm}
        onChange={actions.handleListChange}
        onSubmit={actions.handleCreateList}
        onClose={() => actions.setIsListOpen(false)}
        isSubmitting={isCreatingList}
        error={listError}
      />
      <ListEditModal
        isOpen={isListEditOpen}
        form={listForm}
        onChange={actions.handleListChange}
        onSubmit={actions.handleEditList}
        onClose={() => actions.setIsListEditOpen(false)}
        isSubmitting={isEditingList}
        error={listError}
        hasChanges={hasListEditChanges}
      />
      <ListDangerModal
        isOpen={isListDeletingOpen}
        isSubmitting={isDeletingList}
        error={listError}
        listTitle={activeList?.title}
        onClose={() => actions.setIsListDeletingOpen(false)}
        onConfirm={actions.handleDeleteList}
      />
      <CardCreateModal
        isOpen={isCardOpen}
        form={cardForm}
        onChange={actions.handleCardChange}
        onSubmit={actions.handleCreateCard}
        onClose={() => actions.setIsCardOpen(false)}
        isSubmitting={isCreatingCard}
        error={cardError}
        listTitle={activeList?.title}
      />
      <CardDetailModal
        isOpen={isCardDetailOpen}
        form={cardDetailForm}
        onChange={actions.handleCardDetailChange}
        onSubmit={actions.handleCardDetailSubmit}
        onClose={() => actions.setIsCardDetailOpen(false)}
        isSubmitting={isEditingCard}
        error={cardError}
        attachmentError={attachmentError}
        workspaceMembers={workspaceMembers}
        card={activeCard}
        onDeleteCard={actions.handleDeleteCard}
        onAttachmentUpload={actions.handleAttachmentUpload}
        onDeleteAttachment={actions.handleDeleteAttachment}
        isUploadingAttachment={isUploadingAttachment}
        labelDraft={labelDraft}
        onLabelDraftChange={actions.handleLabelDraftChange}
        onAddLabel={actions.addCardLabel}
        onRemoveLabel={actions.removeCardLabel}
        hasChanges={hasCardDetailChanges}
        onOpenAssignees={actions.openCardAssigneesModal}
        isAdmin={isAdmin}
      />
      <CardAssigneesModal
        isOpen={isCardAssigneesOpen}
        members={workspaceMembers}
        selectedAssignees={cardAssigneeDraft}
        onToggleAssignee={actions.toggleCardAssigneeDraft}
        onClose={actions.closeCardAssigneesModal}
        onSave={actions.saveCardAssignees}
        isSaving={false}
      />
      <CardDangerModal
        isOpen={isCardDeletingOpen}
        isSubmitting={isDeletingCard}
        error={cardError}
        cardTitle={activeCard?.title}
        onClose={() => actions.setIsCardDeletingOpen(false)}
        onConfirm={actions.confirmDeleteCard}
      />
      <BoardViewersModal
        isOpen={isBoardViewersOpen}
        members={workspaceMembers}
        onlineMemberIds={onlineBoardMemberIds}
        onClose={() => actions.setIsBoardViewersOpen(false)}
      />
    </>
  );
}
