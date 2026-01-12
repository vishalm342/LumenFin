'use client';

import * as React from 'react';
import { MoreHorizontal, Pencil, Pin, Trash2, PinOff } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '../ui/input';

interface ChatActionMenuProps {
  chatId: string;
  currentTitle: string;
  isPinned: boolean;
  onRename: (chatId: string, newTitle: string) => void;
  onPin: (chatId: string) => void;
  onDelete: (chatId: string) => void;
}

export default function ChatActionMenu({
  chatId,
  currentTitle,
  isPinned,
  onRename,
  onPin,
  onDelete,
}: ChatActionMenuProps) {
  const [isRenameDialogOpen, setIsRenameDialogOpen] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState(currentTitle);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  // Reset title when dialog opens
  React.useEffect(() => {
    if (isRenameDialogOpen) {
      setNewTitle(currentTitle);
    }
  }, [isRenameDialogOpen, currentTitle]);

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      onRename(chatId, newTitle.trim());
      setIsRenameDialogOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-800 focus:opacity-100 data-[state=open]:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              // Dropdown handles opening via onOpenChange, but we prevent bubbling
            }}
          >
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4 text-slate-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setIsRenameDialogOpen(true);
              setIsDropdownOpen(false);
            }}
          >
            <Pencil className="mr-2 h-3.5 w-3.5" />
            <span>Rename</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onPin(chatId);
              setIsDropdownOpen(false);
            }}
          >
            {isPinned ? (
              <>
                <PinOff className="mr-2 h-3.5 w-3.5" />
                <span>Unpin</span>
              </>
            ) : (
              <>
                <Pin className="mr-2 h-3.5 w-3.5" />
                <span>Pin Chat</span>
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-400 focus:text-red-400 focus:bg-red-900/10"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(chatId);
              setIsDropdownOpen(false);
            }}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()} className="sm:max-w-[425px] bg-[#020617] border-[#1e293b] text-white">
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter a new name for this chat session.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRenameSubmit}>
            <div className="grid gap-4 py-4">
              <Input
                id="name"
                value={newTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTitle(e.target.value)}
                className="col-span-3 bg-[#1e293b] border-[#334155] text-white focus:ring-[#10b981]"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsRenameDialogOpen(false)}
                className="bg-transparent border-[#334155] text-white hover:bg-[#1e293b]"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-[#10b981] hover:bg-[#059669] text-white"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
