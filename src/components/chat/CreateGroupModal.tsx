'use client';

import React, { useState, useEffect } from 'react';
import { Users, X, Check, Loader2, Search } from 'lucide-react';
import { apiService } from '@/lib/api-client';
import { User } from '@/types';
import { useChatStore } from '@/store/useChatStore';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createGroupConversation = useChatStore((s) => s.createGroupConversation);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingUsers(true);
      apiService.searchUsers('a').then((users) => {
        setAvailableUsers(users);
        setIsLoadingUsers(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedUserIds.length === 0) return;

    setIsSubmitting(true);
    try {
      await createGroupConversation(groupName.trim(), selectedUserIds);
      onClose();
      setGroupName('');
      setSelectedUserIds([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = availableUsers.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl glass-panel p-6 shadow-2xl border border-white/10 text-white">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-semibold">Create Group Conversation</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreateGroup} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Core Engineering Team"
              className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Select Participants ({selectedUserIds.length} selected)
            </label>
            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter contacts..."
                className="w-full pl-9 pr-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-xs text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-6 text-gray-400 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span className="text-xs">Loading contacts...</span>
                </div>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const isSelected = selectedUserIds.includes(user.id);
                  return (
                    <div
                      key={user.id}
                      onClick={() => toggleUserSelection(user.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500/50'
                          : 'hover:bg-white/5 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center font-medium text-xs text-white">
                          {user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-200">{user.name}</p>
                          <p className="text-[10px] text-gray-400">{user.phone}</p>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'border-white/20 bg-black/40'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-xs text-gray-500">No contacts found</div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-gray-300 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !groupName.trim() || selectedUserIds.length === 0}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium transition-all shadow-md flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Creating Group...
                </>
              ) : (
                'Create Group'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
