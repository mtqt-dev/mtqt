import type { tl } from '@mtcute/tl'
import type { Sticker } from '../media/sticker.js'
import type { TextWithEntities } from '../misc/entities.js'
import type { Peer } from '../peers/peer.js'
import type { PeersIndex } from '../peers/peers-index.js'
import { assert } from '@fuman/utils'
import { makeInspectable } from '../../utils/inspectable.js'
import { memoizeGetters } from '../../utils/memoize.js'
import { parseDocument } from '../media/document-utils.js'
import { parsePeer } from '../peers/peer.js'

/** An attribute of a unique star gift containing a sticker */
export class StarGiftUniqueAttribute {
    constructor(
        readonly raw: tl.RawStarGiftAttributeModel | tl.RawStarGiftAttributePattern,
    ) {}

    /** Rarity permille of the attribute */
    get permille(): number {
        return this.raw.rarityPermille
    }

    /** Display name of the attribute */
    get name(): string {
        return this.raw.name
    }

    get sticker(): Sticker {
        assert(this.raw.document._ === 'document')
        const parsed = parseDocument(this.raw.document)
        assert(parsed.type === 'sticker')

        return parsed
    }
}

makeInspectable(StarGiftUniqueAttribute)
memoizeGetters(StarGiftUniqueAttribute, ['sticker'])

/** Information about a unique star gift's backdrop */
export class StarGiftUniqueBackdrop {
    constructor(
        readonly raw: tl.RawStarGiftAttributeBackdrop,
    ) {}

    /** Rarity permille of the attribute */
    get permille(): number {
        return this.raw.rarityPermille
    }

    /** Display name of the attribute */
    get name(): string {
        return this.raw.name
    }

    get centerColor(): number {
        return this.raw.centerColor
    }

    get edgeColor(): number {
        return this.raw.edgeColor
    }

    get patternColor(): number {
        return this.raw.patternColor
    }

    get textColor(): number {
        return this.raw.textColor
    }
}
makeInspectable(StarGiftUniqueBackdrop)

/** Details about the original star gift */
export class StarGiftUniqueOriginalDetails {
    constructor(
        readonly raw: tl.RawStarGiftAttributeOriginalDetails,
        readonly _peers: PeersIndex,
    ) {}

    /** ID of the user who sent the original star gift */
    get sender(): Peer | null {
        return this.raw.senderId ? parsePeer(this.raw.senderId, this._peers) : null
    }

    /** ID of the user who received the original star gift */
    get recipient(): Peer {
        return parsePeer(this.raw.recipientId, this._peers)
    }

    /** Date when the original star gift was sent */
    get date(): Date {
        return new Date(this.raw.date * 1000)
    }

    /** Message attached to the original star gift */
    get message(): TextWithEntities | null {
        return this.raw.message ?? null
    }
}

/** A unique star gift */
export class StarGiftUnique {
    readonly _model!: tl.RawStarGiftAttributeModel
    readonly _pattern!: tl.RawStarGiftAttributePattern
    readonly _backdrop!: tl.RawStarGiftAttributeBackdrop
    readonly _originalDetails: tl.RawStarGiftAttributeOriginalDetails | undefined

    /** Whether this gift is a unique gift */
    readonly isUnique = true as const

    constructor(
        readonly raw: tl.RawStarGiftUnique,
        readonly _peers: PeersIndex,
    ) {
        for (const attr of this.raw.attributes) {
            if (attr._ === 'starGiftAttributeModel') {
                this._model = attr
            } else if (attr._ === 'starGiftAttributePattern') {
                this._pattern = attr
            } else if (attr._ === 'starGiftAttributeBackdrop') {
                this._backdrop = attr
            } else if (attr._ === 'starGiftAttributeOriginalDetails') {
                this._originalDetails = attr
            }
        }

        assert(this._model !== undefined)
        assert(this._pattern !== undefined)
        assert(this._backdrop !== undefined)
    }

    /** Number of the NFT */
    get num(): number {
        return this.raw.num
    }

    /** Title of the NFT */
    get title(): string {
        return this.raw.title
    }

    /** Slug of the gift */
    get slug(): string {
        return this.raw.slug
    }

    /** ID of the peer who owns this gift, if available */
    get owner(): Peer | null {
        if (!this.raw.ownerId) return null
        return parsePeer(this.raw.ownerId, this._peers)
    }

    /** Name of the user who owns this gift, if available */
    get ownerName(): string | null {
        return this.raw.ownerName ?? null
    }

    get availabilityIssued(): number {
        return this.raw.availabilityIssued
    }

    get availabilityTotal(): number {
        return this.raw.availabilityTotal
    }

    /** Model (i.e. the gift itself) of the unique star gift */
    get model(): StarGiftUniqueAttribute {
        return new StarGiftUniqueAttribute(this._model)
    }

    /** Pattern of the unique star gift */
    get pattern(): StarGiftUniqueAttribute {
        return new StarGiftUniqueAttribute(this._pattern)
    }

    /** Backdrop of the unique star gift */
    get backdrop(): StarGiftUniqueBackdrop {
        return new StarGiftUniqueBackdrop(this._backdrop)
    }

    /** Details about the original star gift (if they were retained when minting) */
    get originalDetails(): StarGiftUniqueOriginalDetails | null {
        if (!this._originalDetails) return null
        return new StarGiftUniqueOriginalDetails(this._originalDetails, this._peers)
    }

    /** TON address of the owner of the unique star gift */
    get ownerAddress(): string | null {
        return this.raw.ownerAddress ?? null
    }
}

makeInspectable(StarGiftUnique)
memoizeGetters(StarGiftUnique, ['model', 'pattern', 'backdrop', 'originalDetails'])
