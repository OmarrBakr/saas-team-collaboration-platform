const express = require('express');

const {
  requireWorkspaceMember,
  requireWorkspaceRole,
} = require('../middleware/workspace');

const {
  getWorkspaceBoards,
  createBoard,
  getBoard,
  updateBoard,
  deleteBoard,
  addColumn,
  addCard,
  updateColumn,
  deleteColumn,
  moveColumn,
  updateCard,
  deleteCard,
  moveCard,
} = require('../controllers/board');

const router = express.Router({ mergeParams: true });

router.use(requireWorkspaceMember);

router.get('/', getWorkspaceBoards);
router.post('/', requireWorkspaceRole('admin'), createBoard);
router.get('/:boardId', getBoard);
router.patch('/:boardId', requireWorkspaceRole('admin'), updateBoard);
router.delete('/:boardId', requireWorkspaceRole('admin'), deleteBoard);
router.post('/:boardId/columns', requireWorkspaceRole('admin'), addColumn);
router.patch('/:boardId/columns/:columnId', requireWorkspaceRole('admin'), updateColumn);
router.delete('/:boardId/columns/:columnId', requireWorkspaceRole('admin'), deleteColumn);
router.patch('/:boardId/columns/:columnId/move', requireWorkspaceRole('admin'), moveColumn);
router.post('/:boardId/columns/:columnId/cards', requireWorkspaceRole('admin'), addCard);
router.patch('/:boardId/cards/:cardId', requireWorkspaceRole('admin'), updateCard);
router.delete('/:boardId/cards/:cardId', requireWorkspaceRole('admin'), deleteCard);
router.patch(
  '/:boardId/cards/:cardId/move/:fromColumnId/:toColumnId',
  requireWorkspaceRole('admin'),
  moveCard
);

module.exports = router;
