import {
    BotChatJoinRequestUpdate,
    CallbackQuery,
    ChatMemberUpdate,
    ChosenInlineResult,
    DeleteStoryUpdate,
    HistoryReadUpdate,
    InlineQuery,
    MaybeArray,
    Message,
    PollVoteUpdate,
    StoryUpdate,
    User,
    UserStatusUpdate,
    UserTypingUpdate,
} from '@mtcute/client'

import { UpdateContextDistributed } from '../context/base.js'
import { UpdateFilter } from './types.js'

/**
 * Filter messages generated by yourself (including Saved Messages)
 */
export const me: UpdateFilter<Message, { sender: User }> = (msg) =>
    (msg.sender.type === 'user' && msg.sender.isSelf) || msg.isOutgoing

/**
 * Filter messages sent by bots
 */
export const bot: UpdateFilter<Message, { sender: User }> = (msg) => msg.sender.constructor === User && msg.sender.isBot

// prettier-ignore
/**
 * Filter updates by user ID(s) or username(s)
 *
 * Note that only some updates support filtering by username.
 */
export const userId: {
    (id: MaybeArray<number>): UpdateFilter<UpdateContextDistributed<
        | Message
        | StoryUpdate
        | DeleteStoryUpdate
        | InlineQuery
        | ChatMemberUpdate
        | ChosenInlineResult
        | CallbackQuery
        | PollVoteUpdate
        | BotChatJoinRequestUpdate
    >>
    (id: MaybeArray<number | string>): UpdateFilter<UpdateContextDistributed<
        | Message
        | UserStatusUpdate
        | UserTypingUpdate
        | StoryUpdate
        | HistoryReadUpdate
        | DeleteStoryUpdate
        | InlineQuery
        | ChatMemberUpdate
        | ChosenInlineResult
        | CallbackQuery
        | PollVoteUpdate
        | BotChatJoinRequestUpdate
    >>
} = (id) => {
    const indexId = new Set<number>()
    const indexUsername = new Set<string>()
    let matchSelf = false

    if (!Array.isArray(id)) id = [id]
    id.forEach((id) => {
        if (id === 'me' || id === 'self') {
            matchSelf = true
        } else if (typeof id === 'string') {
            indexUsername.add(id)
        } else {
            indexId.add(id)
        }
    })

    return (upd) => {
        switch (upd._name) {
            case 'new_message':
            case 'edit_message': {
                const sender = upd.sender

                return (matchSelf && sender.isSelf) ||
                    indexId.has(sender.id) ||
                    indexUsername.has(sender.username!)
            }
            case 'user_status':
            case 'user_typing': {
                const id = upd.userId

                return (matchSelf && id === upd.client.getAuthState().userId) ||
                    indexId.has(id)
            }
            case 'poll_vote':
            case 'story':
            case 'delete_story': {
                const peer = upd.peer
                if (peer.type !== 'user') return false

                return (matchSelf && peer.isSelf) ||
                    indexId.has(peer.id) ||
                    Boolean(peer.usernames?.some((u) => indexUsername.has(u.username)))
            }
            case 'history_read': {
                const id = upd.chatId

                return (matchSelf && id === upd.client.getAuthState().userId) ||
                    indexId.has(id)
            }
        }

        const user = upd.user

        return (
            (matchSelf && user.isSelf) ||
            indexId.has(user.id) ||
            Boolean(user.usernames?.some((u) => indexUsername.has(u.username)))
        )
    }
}
