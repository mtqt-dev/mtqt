import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike } from '../../types/index.js'
import { toInputChannel } from '../../utils/peer-utils.js'
import { resolvePeer } from '../users/resolve-peer.js'

// @alias=deleteSupergroup
/**
 * Delete a channel or a supergroup
 *
 * @param chatId  Chat ID or username
 */
export async function deleteChannel(client: ITelegramClient, chatId: InputPeerLike): Promise<void> {
    const res = await client.call({
        _: 'channels.deleteChannel',
        channel: toInputChannel(await resolvePeer(client, chatId), chatId),
    })
    client.handleClientUpdate(res)
}