import { TelegramClient } from '../../client'
import { TermsOfService, User } from '../../types'
import { normalizePhoneNumber } from '../../utils/misc-utils'
import { assertTypeIs } from '../../utils/type-assertion'

/**
 * Authorize a user in Telegram with a valid confirmation code.
 *
 * @param phone  Phone number in international format
 * @param phoneCodeHash  Code identifier from {@link TelegramClient.sendCode}
 * @param phoneCode  The confirmation code that was received
 * @returns
 *   - If the code was valid and authorization succeeded, the {@link User} is returned.
 *   - If the given phone number needs to be registered AND the ToS must be accepted,
 *     an object containing them is returned.
 *   - If the given phone number needs to be registered, `false` is returned.
 * @throws BadRequestError  In case the arguments are invalid
 * @throws SessionPasswordNeededError  In case a password is needed to sign in
 * @internal
 */
export async function signIn(
    this: TelegramClient,
    phone: string,
    phoneCodeHash: string,
    phoneCode: string,
): Promise<User | TermsOfService | false> {
    phone = normalizePhoneNumber(phone)

    const res = await this.call({
        _: 'auth.signIn',
        phoneNumber: phone,
        phoneCodeHash,
        phoneCode,
    })

    if (res._ === 'auth.authorizationSignUpRequired') {
        if (res.termsOfService) return new TermsOfService(res.termsOfService)

        return false
    }

    assertTypeIs('signIn (@ auth.signIn -> user)', res.user, 'user')

    this._userId = res.user.id
    this.log.prefix = `[USER ${this._userId}] `
    this._isBot = false
    this._selfChanged = true
    this._selfUsername = res.user.username ?? null
    await this.network.notifyLoggedIn(res)

    await this._fetchUpdatesState()
    await this._saveStorage()

    // telegram ignores invokeWithoutUpdates for auth methods
    if (this.network.params.disableUpdates) this.network.resetSessions()
    else this.startUpdatesLoop()

    return new User(this, res.user)
}
