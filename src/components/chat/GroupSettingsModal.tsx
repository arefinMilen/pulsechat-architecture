'use client';

import React, { useState } from 'react';
import { Users, X, Shield, Edit2, Check, UserMinus, LogOut } from 'lucide-react';
import { Conversation } from '@/types';
import { apiService } from '@/lib/api-client';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';

interface GroupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
}

export function GroupSettingsModal({ isOpen, onClose, conversation }: GroupSettingsModalProps) {
  const currentUser = useAuthStore((s) => s.user);
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(conversation.name || '');

  if (!isOpen || !conversation) return null;

  const isAdmin = conversation.adminIds?.includes(currentUser?.id || '');

  const handleSaveTitle = async () => {
    if (!newTitle.trim() || newTitle === conversation.name) {
      setIsRenaming(false);
      return;
    }
    await apiService.renameGroup(conversation.id, newTitle.trim());
    await fetchConversations();
    setIsRenaming(false);
  };

  const handlePromoteAdmin = async (userId: string) => {
    await apiService.promoteAdmin(conversation.id, userId);
    await fetchConversations();
  };

  const handleRemoveMember = async (userId: string) => {
    await apiService.removeParticipant(conversation.id, userId);
    await fetchConversations();
  };

  const handleLeaveGroup = async () => {
    if (currentUser) {
      await apiService.removeParticipant(conversation.id, currentUser.id);
      await fetchConversations();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl glass-panel p-6 shadow-2xl border border-white/10 text-white">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-semibold">Group Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-5">
          {/* Group Title Section */}
          <div className="bg-white/5 p-4 rounded-xl border border-white/5">
            <label className="block text-xs font-medium text-gray-400 mb-1">Group Name</label>
            {isRenaming ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-1.5 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-100">
                  {conversation.name || 'Group Conversation'}
                </span>
                {isAdmin && (
                  <button
                    onClick={() => setIsRenaming(true)}
                    className="p-1 rounded text-gray-400 hover:text-indigo-300 hover:bg-white/10"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Members List */}
          <div>
            {(() => {
              const participants = Array.isArray(conversation?.participants) ? conversation.participants : [];
              return (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-400">
                      Participants ({participants.length})
                    </span>
                    {isAdmin && (
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                        Admin Managed
                      </span>
                    )}
                  </div>

                  <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                    {participants.map((user) => {
                      const userIsAdmin = conversation.adminIds?.includes(user?.id);
                      const isSelf = user?.id === currentUser?.id;

                      return (
                        <div
                          key={user?.id || Math.random()}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-medium text-xs text-white">
                              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium text-gray-200">
                                  {user?.name || 'User'} {isSelf && '(You)'}
                                </span>
                                {userIsAdmin && (
                                  <Shield className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                                )}
                              </div>
                              <span className="text-[10px] text-gray-400">{user?.phone || ''}</span>
                            </div>
                          </div>

                          {isAdmin && !isSelf && user?.id && (
                            <div className="flex items-center gap-1">
                              {!userIsAdmin && (
                                <button
                                  onClick={() => handlePromoteAdmin(user.id)}
                                  title="Promote to Admin"
                                  className="p-1 rounded text-gray-400 hover:text-amber-400 hover:bg-white/10"
                                >
                                  <Shield className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleRemoveMember(user.id)}
                                title="Remove Member"
                                className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-white/10"
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>

          <div className="pt-3 border-t border-white/10 flex justify-between items-center">
            <button
              onClick={handleLeaveGroup}
              className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Leave Group
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 text-xs font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
