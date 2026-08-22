'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, Edit2, Loader2, LogOut, Shield, UserMinus, Users } from 'lucide-react';
import { Conversation } from '@/types';
import { apiService } from '@/lib/api-client';
import { apiError } from '@/lib/normalize';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import { Modal } from '@/components/ui/Modal';
import { initialsOf, userLabel } from '@/lib/display';

interface GroupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
}

export function GroupSettingsModal({ isOpen, onClose, conversation }: GroupSettingsModalProps) {
  const currentUser = useAuthStore((s) => s.user);
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  const clearActiveConversation = useChatStore((s) => s.clearActiveConversation);
  const fetchConversations = useChatStore((s) => s.fetchConversations);

  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(conversation.name || '');
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNewTitle(conversation.name || '');
      setIsRenaming(false);
      setError(null);
    }
  }, [isOpen, conversation.name]);

  const isAdmin = !!currentUser?.id && (conversation.adminIds ?? []).includes(currentUser.id);
  const participants = conversation.participants ?? [];

  /** Runs a group mutation, applying the conversation the API returns. */
  const run = async (key: string, action: () => Promise<Conversation>) => {
    setPendingAction(key);
    setError(null);
    try {
      upsertConversation(await action());
    } catch (err) {
      setError(apiError(err));
    } finally {
      setPendingAction(null);
    }
  };

  const handleSaveTitle = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed || trimmed === conversation.name) {
      setIsRenaming(false);
      return;
    }
    await run('rename', () => apiService.renameGroup(conversation.id, trimmed));
    setIsRenaming(false);
  };

  const handleLeaveGroup = async () => {
    if (!currentUser) return;
    setPendingAction('leave');
    setError(null);
    try {
      await apiService.removeParticipant(conversation.id, currentUser.id);
      clearActiveConversation();
      await fetchConversations();
      onClose();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Group settings"
      icon={<Users className="w-5 h-5 text-indigo-400 shrink-0" />}
    >
      <div className="mt-4 space-y-5">
        {error && (
          <p className="px-3 py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        {/* Name */}
        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
          <label className="block text-xs font-medium text-gray-400 mb-1">Group name</label>
          {isRenaming ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleSaveTitle();
                  }
                }}
                aria-label="Group name"
                className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                autoFocus
              />
              <button
                type="button"
                onClick={() => void handleSaveTitle()}
                disabled={pendingAction === 'rename'}
                aria-label="Save group name"
                className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shrink-0"
              >
                {pendingAction === 'rename' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-gray-100 truncate">
                {conversation.name || 'Unnamed group'}
              </p>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsRenaming(true)}
                  aria-label="Rename group"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
          {!isAdmin && (
            <p className="text-[10px] text-gray-500 mt-2">
              Only group admins can rename the group or manage members.
            </p>
          )}
        </div>

        {/* Members */}
        <div>
          <h3 className="text-xs font-medium text-gray-400 mb-2">
            Participants ({participants.length})
          </h3>
          <ul className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {participants.map((member) => {
              const isMemberAdmin = (conversation.adminIds ?? []).includes(member.id);
              const isSelf = member.id === currentUser?.id;

              return (
                <li
                  key={member.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center font-medium text-xs text-white shrink-0">
                      {initialsOf(userLabel(member))}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-200 truncate">
                        {userLabel(member)}
                        {isSelf && <span className="text-gray-500"> (you)</span>}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {isMemberAdmin ? 'Admin' : member.phone}
                      </p>
                    </div>
                  </div>

                  {isAdmin && !isSelf && (
                    <div className="flex items-center gap-1 shrink-0">
                      {!isMemberAdmin && (
                        <button
                          type="button"
                          disabled={pendingAction === `promote-${member.id}`}
                          onClick={() =>
                            void run(`promote-${member.id}`, () =>
                              apiService.promoteAdmin(conversation.id, member.id)
                            )
                          }
                          aria-label={`Make ${userLabel(member)} an admin`}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-300 hover:bg-indigo-500/20 disabled:opacity-50 transition-colors"
                        >
                          {pendingAction === `promote-${member.id}` ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Shield className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={pendingAction === `remove-${member.id}`}
                        onClick={() =>
                          void run(`remove-${member.id}`, () =>
                            apiService.removeParticipant(conversation.id, member.id)
                          )
                        }
                        aria-label={`Remove ${userLabel(member)} from the group`}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                      >
                        {pendingAction === `remove-${member.id}` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <UserMinus className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={() => void handleLeaveGroup()}
            disabled={pendingAction === 'leave'}
            className="w-full px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {pendingAction === 'leave' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            Leave group
          </button>
        </div>
      </div>
    </Modal>
  );
}
