import { tl } from '@mtcute/core'

import { TelegramClient } from '../../client'

/**
 * Get list of folders.
 * @internal
 */
export async function getFolders(this: TelegramClient): Promise<tl.TypeDialogFilter[]> {
    return this.call({
        _: 'messages.getDialogFilters',
    })
}
