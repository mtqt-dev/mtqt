import { describe, expect, it, vi } from 'vitest'

import { Long, toggleChannelIdMark } from '@mtcute/core'
import { createStub, StubTelegramClient } from '@mtcute/test'

import { getAuthState } from '../auth/_state.js'
import { sendText } from './send-text.js'

const stubUser = createStub('user', {
    id: 123123,
    accessHash: Long.fromBits(123, 456),
})
const stubChannel = createStub('channel', {
    id: 444222,
    accessHash: Long.fromBits(666, 777),
    megagroup: true,
})

describe('sendText', () => {
    it('should correctly handle updateNewMessage', async () => {
        const client = new StubTelegramClient()

        client.respondWith('messages.sendMessage', (req) =>
            createStub('updates', {
                users: [stubUser],
                updates: [
                    {
                        _: 'updateMessageID',
                        randomId: req.randomId,
                        id: 123,
                    },
                    {
                        _: 'updateNewMessage',
                        pts: 0,
                        ptsCount: 1,
                        message: createStub('message', {
                            id: 123,
                            message: req.message,
                            peerId: {
                                _: 'peerUser',
                                userId: stubUser.id,
                            },
                        }),
                    },
                ],
            }),
        )

        await client.with(async () => {
            const msg = await sendText(client, stubUser.id, 'test')

            expect(msg).toBeDefined()
            expect(msg.id).toEqual(123)
            expect(msg.chat.chatType).toEqual('private')
            expect(msg.chat.id).toEqual(stubUser.id)
            expect(msg.text).toEqual('test')
        })
    })

    it('should correctly handle updateNewChannelMessage', async () => {
        const client = new StubTelegramClient()

        client.respondWith('messages.sendMessage', (req) =>
            createStub('updates', {
                users: [stubUser],
                chats: [stubChannel],
                updates: [
                    {
                        _: 'updateMessageID',
                        randomId: req.randomId,
                        id: 123,
                    },
                    {
                        _: 'updateNewChannelMessage',
                        pts: 0,
                        ptsCount: 1,
                        message: createStub('message', {
                            id: 123,
                            message: req.message,
                            peerId: {
                                _: 'peerChannel',
                                channelId: stubChannel.id,
                            },
                        }),
                    },
                ],
            }),
        )

        await client.with(async () => {
            const markedChannelId = toggleChannelIdMark(stubChannel.id)

            const msg = await sendText(client, markedChannelId, 'test')

            expect(msg).toBeDefined()
            expect(msg.id).toEqual(123)
            expect(msg.chat.chatType).toEqual('supergroup')
            expect(msg.chat.id).toEqual(markedChannelId)
            expect(msg.text).toEqual('test')
        })
    })

    it('should correctly handle updateShortSentMessage with cached peer', async () => {
        const client = new StubTelegramClient()

        await client.registerPeers(stubUser)
        getAuthState(client).userId = stubUser.id

        client.respondWith('messages.sendMessage', () =>
            createStub('updateShortSentMessage', {
                id: 123,
                out: true,
            }),
        )

        await client.with(async () => {
            const msg = await sendText(client, stubUser.id, 'test')

            expect(msg).toBeDefined()
            expect(msg.id).toEqual(123)
            expect(msg.chat.chatType).toEqual('private')
            expect(msg.chat.id).toEqual(stubUser.id)
            expect(msg.text).toEqual('test')
        })
    })

    it('should correctly handle updateShortSentMessage without cached peer', async () => {
        const client = new StubTelegramClient()

        getAuthState(client).userId = stubUser.id

        const getUsersFn = client.respondWith(
            'users.getUsers',
            vi.fn(() => [stubUser]),
        )

        client.respondWith('messages.sendMessage', () =>
            createStub('updateShortSentMessage', {
                id: 123,
                out: true,
            }),
        )

        await client.with(async () => {
            const msg = await sendText(client, stubUser.id, 'test')

            expect(getUsersFn).toHaveBeenCalledWith({
                _: 'users.getUsers',
                id: [{ _: 'inputUser', userId: stubUser.id, accessHash: Long.ZERO }],
            })

            expect(msg).toBeDefined()
            expect(msg.id).toEqual(123)
            expect(msg.chat.chatType).toEqual('private')
            expect(msg.chat.id).toEqual(stubUser.id)
            expect(msg.text).toEqual('test')
        })
    })
})
