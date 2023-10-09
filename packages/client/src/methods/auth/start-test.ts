import { BaseTelegramClient, MtArgumentError } from '@mtcute/core'

import { User } from '../../types'
import { logOut } from './log-out'
import { start } from './start'

/**
 * Utility function to quickly authorize on test DC
 * using a [Test phone number](https://core.telegram.org/api/auth#test-phone-numbers),
 * which is randomly generated by default.
 *
 * > **Note**: Using this method assumes that you
 * > are using a test DC in `primaryDc` parameter.
 *
 * @param params  Additional parameters
 */
export async function startTest(
    client: BaseTelegramClient,
    params?: {
        /**
         * Whether to log out if current session is logged in.
         *
         * Defaults to false.
         */
        logout?: boolean

        /**
         * Override phone number. Must be a valid Test phone number.
         *
         * By default is randomly generated.
         */
        phone?: string

        /**
         * Override user's DC. Must be a valid test DC.
         */
        dcId?: number
    },
): Promise<User> {
    if (!params) params = {}

    if (params.logout) {
        try {
            await logOut(client)
        } catch (e) {}
    }

    const availableDcs = await client
        .call({
            _: 'help.getConfig',
        })
        .then((res) => res.dcOptions)

    let phone = params.phone

    if (phone) {
        if (!phone.match(/^99966\d{5}/)) {
            throw new MtArgumentError(`${phone} is an invalid test phone number`)
        }
        const id = parseInt(phone[5])

        if (!availableDcs.find((dc) => dc.id === id)) {
            throw new MtArgumentError(`${phone} has invalid DC ID (${id})`)
        }
    } else {
        let dcId = client.network.getPrimaryDcId()

        if (params.dcId) {
            if (!availableDcs.find((dc) => dc.id === params!.dcId)) {
                throw new MtArgumentError(`DC ID is invalid (${dcId})`)
            }
            dcId = params.dcId
        }

        let numbers = Math.floor(Math.random() * 9999).toString()
        while (numbers.length !== 4) numbers += '0'

        phone = `99966${dcId}${numbers}`
    }

    let code = ''

    return start(client, {
        phone,
        code: () => code,
        codeSentCallback: (sent) => {
            for (let i = 0; i < sent.length; i++) {
                code += phone![5]
            }
        },
    })
}
