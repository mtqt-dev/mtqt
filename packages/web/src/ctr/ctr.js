import { Buffer } from "buffer";

function incr32(iv) {
	var len = iv.length;
	var item;
	while (len--) {
		item = iv.readUInt8(len);
		if (item === 255) {
			iv.writeUInt8(0, len);
		} else {
			item++;
			iv.writeUInt8(item, len);
			break;
		}
	}
}

function xor(a, b) {
	var length = Math.min(a.length, b.length);
	var buffer = Buffer.alloc(length);

	for (var i = 0; i < length; ++i) {
		buffer[i] = a[i] ^ b[i];
	}

	return buffer;
}

function getBlock(self) {
	var out = self._cipher.encryptBlockRaw(self._prev);
	incr32(self._prev);
	return out;
}

var blockSize = 16;

export function encrypt(self, chunk) {
	var chunkNum = Math.ceil(chunk.length / blockSize);
	var start = self._cache.length;
	self._cache = Buffer.concat([self._cache, Buffer.allocUnsafe(chunkNum * blockSize)]);
	for (var i = 0; i < chunkNum; i++) {
		var out = getBlock(self);
		var offset = start + i * blockSize;
		self._cache.writeUInt32BE(out[0], offset + 0);
		self._cache.writeUInt32BE(out[1], offset + 4);
		self._cache.writeUInt32BE(out[2], offset + 8);
		self._cache.writeUInt32BE(out[3], offset + 12);
	}
	var pad = self._cache.slice(0, chunk.length);
	self._cache = self._cache.slice(chunk.length);
	return xor(chunk, pad);
}
