'use client';

import { useState, useEffect } from 'react';
import {
    MessageSquare,
    Trash2,
    MoreVertical,
    Edit2,
    Pin,
    PinOff,
    Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ChatSession {
    _id: string;
    title: string;
    isPinned: boolean;
    createdAt: string;
}

interface SidebarProps {
    isOpen: boolean;
    currentChatId: string;
    onSelectChat: (chatId: string) => void;
    onNewChat: () => void;
    // We allow the parent to trigger a refresh if needed, but Sidebar can manage its own list state mostly
    refreshTrigger?: number;
}

export default function Sidebar({
    isOpen,
    currentChatId,
    onSelectChat,
    onNewChat,
    refreshTrigger
}: SidebarProps) {
    const [chats, setChats] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [chatToRename, setChatToRename] = useState<ChatSession | null>(null);
    const [newTitle, setNewTitle] = useState('');

    const fetchChats = async () => {
        try {
            const res = await fetch('/api/chats');
            if (res.ok) {
                const data = await res.json();
                setChats(data.chats || []);
            }
        } catch (error) {
            console.error('Failed to fetch chats', error);
            toast.error('Failed to load history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChats();
    }, [refreshTrigger]);

    const handlePin = async (e: React.MouseEvent, chat: ChatSession) => {
        e.stopPropagation();
        // Optimistic update
        const updatedChats = chats.map(c =>
            c._id === chat._id ? { ...c, isPinned: !c.isPinned } : c
        ).sort((a, b) => {
            // Re-sort: Pinned first, then date
            if (a.isPinned === b.isPinned) {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            return a.isPinned ? -1 : 1;
        });

        setChats(updatedChats);

        try {
            await fetch(`/api/chats/${chat._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPinned: !chat.isPinned })
            });
            toast.success(chat.isPinned ? 'Chat unpinned' : 'Chat pinned');
        } catch (error) {
            toast.error('Failed to update pin status');
            fetchChats(); // Revert on error
        }
    };

    const deleteChat = async (e: React.MouseEvent, chatId: string) => {
        e.stopPropagation();
        // Optimistic
        const previousChats = [...chats];
        setChats(chats.filter(c => c._id !== chatId));

        try {
            const res = await fetch(`/api/chats/${chatId}`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error('Failed to delete');

            toast.success('Chat deleted');

            if (currentChatId === chatId) {
                onNewChat(); // If deleted current, go to new/default
            }
        } catch (error) {
            toast.error('Failed to delete chat');
            setChats(previousChats);
        }
    };

    const openRenameDialog = (e: React.MouseEvent, chat: ChatSession) => {
        e.stopPropagation();
        setChatToRename(chat);
        setNewTitle(chat.title);
        setRenameDialogOpen(true);
    };

    const submitRename = async () => {
        if (!chatToRename || !newTitle.trim()) return;

        const previousChats = [...chats];
        setChats(chats.map(c =>
            c._id === chatToRename._id ? { ...c, title: newTitle } : c
        ));
        setRenameDialogOpen(false);

        try {
            await fetch(`/api/chats/${chatToRename._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle })
            });
            toast.success('Chat renamed');
        } catch (error) {
            toast.error('Failed to rename chat');
            setChats(previousChats);
        }
    };

    return (
        <>
            <aside
                className={cn(
                    "bg-slate-900/50 backdrop-blur-md border-r border-slate-800 transition-all duration-300 flex flex-col overflow-hidden",
                    isOpen ? "w-72" : "w-0"
                )}
            >
                <div className="p-4 border-b border-white/10">
                    <Button
                        onClick={onNewChat}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Chat
                    </Button>
                </div>

                <ScrollArea className="flex-1 px-2 pt-2">
                    <div className="space-y-1 pb-4">
                        {chats.map((chat) => (
                            <div
                                key={chat._id}
                                onClick={() => onSelectChat(chat._id)}
                                className={cn(
                                    "group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border border-transparent",
                                    currentChatId === chat._id
                                        ? "bg-white/10 border-white/10 shadow-sm"
                                        : "hover:bg-white/5 hover:border-white/5 text-slate-400 hover:text-slate-200"
                                )}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                                    <span className="text-sm truncate font-medium">
                                        {chat.title || "New Chat"}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {chat.isPinned && (
                                        <Pin className="w-3 h-3 text-blue-400 rotate-45 mr-1" />
                                    )}

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-white/20">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40 bg-slate-900 border-slate-800 text-slate-300">
                                            <DropdownMenuItem onClick={(e) => openRenameDialog(e, chat)}>
                                                <Edit2 className="w-4 h-4 mr-2" />
                                                Rename
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={(e) => handlePin(e, chat)}>
                                                {chat.isPinned ? (
                                                    <>
                                                        <PinOff className="w-4 h-4 mr-2" />
                                                        Unpin
                                                    </>
                                                ) : (
                                                    <>
                                                        <Pin className="w-4 h-4 mr-2" />
                                                        Pin
                                                    </>
                                                )}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-slate-800" />
                                            <DropdownMenuItem onClick={(e) => deleteChat(e, chat._id)} className="text-red-400 focus:text-red-400 focus:bg-red-950/30">
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </aside>

            <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Rename Chat</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="bg-slate-950 border-slate-800 focus:border-blue-500"
                            placeholder="Enter chat title..."
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
                        <Button onClick={submitRename} className="bg-blue-600 hover:bg-blue-700">Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
