import React from "react";
import type { Board, List, Card } from "@shared/schema";
import { useBoardContext } from "@/lib/board-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";

interface BoardListProps {
  board: Board;
  openCardModal: (cardId: number) => void;
}

export function BoardList({ board, openCardModal }: BoardListProps) {
  const { lists, cards, visibleCards, cardMembers, moveCard } = useBoardContext();

  // Filter lists that belong to this board
  const boardLists = lists.filter((l: any) => l.boardId === board.id);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const cardId = parseInt(draggableId.replace("card-", ""));
    const sourceListId = parseInt(source.droppableId.replace("list-", ""));
    const destinationListId = parseInt(destination.droppableId.replace("list-", ""));

    moveCard(cardId, sourceListId, destinationListId, destination.index);
  };

  // Render rows grouped by list (table-like)
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Lista de tarefas</h2>
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="space-y-6">
            {boardLists.map((list: List) => (
              <div key={list.id}>
                <div className="text-sm font-medium mb-2">{list.title}</div>
                <Droppable droppableId={`list-${list.id}`} type="CARD">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="bg-gray-50 rounded border overflow-hidden">
                      {(visibleCards[list.id] || cards[list.id] || []).map((card: Card, index: number) => (
                        <Draggable key={card.id} draggableId={`card-${card.id}`} index={index}>
                          {(prov) => (
                            <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps} className="flex items-center justify-between px-3 py-2 border-b last:border-b-0 cursor-move" onClick={() => openCardModal(card.id)}>
                              <div className="flex items-center gap-3">
                                <div className="text-sm">{card.title}</div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-xs text-muted-foreground">
                                  {card.dueDate ? new Date(card.dueDate).toLocaleDateString() : ""}
                                </div>
                                <div>
                                  {(() => {
                                    const members = cardMembers[card.id] || [];
                                    const assignee = members[0];
                                    if (!assignee) return null;
                                    const initials = (assignee.name || assignee.username || "").split(" ").map((s: string) => s.charAt(0)).join("").slice(0,2).toUpperCase();
                                    return (
                                      <Avatar className="h-6 w-6">
                                        {assignee.profilePicture ? (
                                          <AvatarImage src={assignee.profilePicture} alt={assignee.name || assignee.username} />
                                        ) : (
                                          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                                        )}
                                      </Avatar>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
