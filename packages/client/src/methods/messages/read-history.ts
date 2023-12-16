import { BaseTelegramClient } from '@mtcute/core'
import { assertTrue } from '@mtcute/core/utils.js'

import { InputPeerLike } from '../../types/index.js'
import { isInputPeerChannel, toInputChannel } from '../../utils/peer-utils.js'
import { createDummyUpdate } from '../../utils/updates-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Mark chat history as read.
 *
 * @param chatId  Chat ID
 */
export async function readHistory(
    client: BaseTelegramClient,
    chatId: InputPeerLike,
    params?: {
        /**
         * Message up until which to read history
         *
         * @default  0, i.e. read everything
         */
        maxId?: number

        /**
         * Whether to also clear all mentions in the chat
         */
        clearMentions?: boolean
    },
): Promise<void> {
    const { maxId = 0, clearMentions } = params ?? {}

    const peer = await resolvePeer(client, chatId)

    if (clearMentions) {
        const res = await client.call({
            _: 'messages.readMentions',
            peer,
        })

        if (isInputPeerChannel(peer)) {
            client.network.handleUpdate(createDummyUpdate(res.pts, res.ptsCount, peer.channelId))
        } else {
            client.network.handleUpdate(createDummyUpdate(res.pts, res.ptsCount))
        }
    }

    if (isInputPeerChannel(peer)) {
        const r = await client.call({
            _: 'channels.readHistory',
            channel: toInputChannel(peer),
            maxId,
        })

        assertTrue('channels.readHistory', r)
    } else {
        const res = await client.call({
            _: 'messages.readHistory',
            peer,
            maxId,
        })
        client.network.handleUpdate(createDummyUpdate(res.pts, res.ptsCount))
    }
}
