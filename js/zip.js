/* =====================================================================
   작은 zip 만들기 (라이브러리 없이)
   - 여러 파일을 압축하지 않고 한 묶음(.zip)으로 담아요. 활동지 이미지는 이미 JPEG라서 압축해도 거의 안 줄어요.
   - 파일 이름은 UTF-8 로 적어서 한글 이름이 깨지지 않아요 (윈도우 10 이상, 맥, 휴대폰 OK).
   - 쓰는 법: MiniZip.make([{ name: '폴더/파일.py', data: '글자' 또는 Uint8Array }]) → Blob
   ===================================================================== */
'use strict';

window.MiniZip = (() => {
  // CRC-32: 파일이 깨지지 않았는지 확인하는 값. 표를 한 번 만들어 두고 써요.
  const TABLE = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    TABLE[n] = c >>> 0;
  }
  const crc32 = (u8) => {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < u8.length; i++) c = TABLE[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  };
  const enc = new TextEncoder();

  function make(files) {
    const now = new Date();
    const time = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    const parts = [], central = [];
    let offset = 0;
    const used = new Set();
    for (const f of files) {
      // 같은 이름이 또 나오면 뒤에 (2), (3) 을 붙여요
      let nm = f.name, k = 2;
      while (used.has(nm)) { nm = f.name.replace(/(\.[^./]+)?$/, ` (${k++})$1`); }
      used.add(nm);
      const name = enc.encode(nm);
      const data = typeof f.data === 'string' ? enc.encode(f.data) : f.data;
      const crc = crc32(data);
      const h = new DataView(new ArrayBuffer(30));          // 파일마다 앞에 붙는 머리
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true);   // 0x0800 = 이름이 UTF-8
      h.setUint16(8, 0, true); h.setUint16(10, time, true); h.setUint16(12, date, true);
      h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true);
      h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      const c = new DataView(new ArrayBuffer(46));          // 맨 끝 목차에 들어갈 한 줄
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
      c.setUint16(10, 0, true); c.setUint16(12, time, true); c.setUint16(14, date, true);
      c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
      c.setUint16(28, name.length, true); c.setUint32(42, offset, true);
      central.push(new Uint8Array(c.buffer), name);
      offset += 30 + name.length + data.length;
    }
    const size = central.reduce((s, a) => s + a.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, size, true); end.setUint32(16, offset, true);
    return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: 'application/zip' });
  }

  // data:image/jpeg;base64,.... → 바이트
  function fromDataUrl(url) {
    const b = atob(String(url).split(',')[1] || '');
    const a = new Uint8Array(b.length);
    for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
    return a;
  }
  const extOf = (url) => (/^data:image\/png/.test(url) ? '.png' : '.jpg');

  return { make, fromDataUrl, extOf };
})();
