import { assertTrue } from '../../../utils/type-assertions.js'
import { ITelegramClient } from '../../client.types.js'
import { InputPeerLike, InputStickerSet, normalizeInputStickerSet } from '../../types/index.js'
import { toInputChannel } from '../../utils/index.js'
import { resolvePeer } from '../users/resolve-peer.js'

/**
 * Set group sticker set for a supergroup
 *
 * @param setId  Sticker set short name or a TL object with input sticker set
 * @param thumb  Sticker set thumbnail
 * @param params
 * @returns  Modified sticker set
 */
export async function setChatStickerSet(
    client: ITelegramClient,
    chatId: InputPeerLike,
    setId: InputStickerSet,
): Promise<void> {
    const r = await client.call({
        _: 'channels.setStickers',
        channel: toInputChannel(await resolvePeer(client, chatId), chatId),
        stickerset: normalizeInputStickerSet(setId),
    })

    assertTrue('channels.setStickers', r)
}