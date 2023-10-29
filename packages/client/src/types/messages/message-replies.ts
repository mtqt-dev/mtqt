import { getMarkedPeerId, tl } from '@mtcute/core'

import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { Chat } from '../peers/chat.js'
import { PeersIndex } from '../peers/peers-index.js'
import { User } from '../peers/user.js'

/**
 * Information about replies to a message
 */
export class MessageRepliesInfo {
    constructor(
        readonly raw: tl.RawMessageReplies,
        readonly _peers: PeersIndex,
    ) {}

    /**
     * Whether this message is a channel post that has a comments thread
     * in the linked discussion group
     */
    get hasComments(): boolean {
        return this.raw.comments!
    }

    /**
     * Total number of replies
     */
    get count(): number {
        return this.raw.replies
    }

    /**
     * Whether this reply thread has unread messages
     */
    get hasUnread(): boolean {
        return this.raw.readMaxId !== undefined && this.raw.readMaxId !== this.raw.maxId
    }

    /**
     * ID of the last message in the thread (if any)
     */
    get lastMessageId(): number | null {
        return this.raw.maxId ?? null
    }

    /**
     * ID of the last read message in the thread (if any)
     */
    get lastReadMessageId(): number | null {
        return this.raw.readMaxId ?? null
    }

    /**
     * ID of the discussion group for the post
     */
    get discussion(): number {
        return getMarkedPeerId(this.raw.channelId!, 'channel')
    }

    /**
     * Last few commenters to the post (usually 3)
     */
    get repliers(): (User | Chat)[] {
        return this.raw.recentRepliers!.map((it) => {
            switch (it._) {
                case 'peerUser':
                    return new User(this._peers.user(it.userId))
                case 'peerChannel':
                    return new Chat(this._peers.chat(it.channelId))
                default:
                    throw new Error('Unexpected peer type: ' + it._)
            }
        })
    }
}

memoizeGetters(MessageRepliesInfo, ['discussion', 'repliers'])
makeInspectable(MessageRepliesInfo)
