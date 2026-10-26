# Third-Party Notices & Licenses

Lupis Engine incorporates or depends on third-party software and digital assets. This document provides notices, licenses, and attributions for these components.

> [!NOTE]
> Sample projects located in [`examples/`](./examples/) contain third-party game assets (sprites, tilesets, audio, and UI). Their specific attributions and licenses are included directly inside each project archive as `CREDIT.md`.

---

## 1. Bundled Fonts & Assets

### Inter Font
- **Path**: `core/Assets/Fonts/` (`defaultFont.fnt`, `defaultFont.js`, `defaultFont.png`)
- **Author**: Rasmus Andersson ([https://rsms.me/inter/](https://rsms.me/inter/))
- **License**: SIL Open Font License, Version 1.1 (OFL-1.1)
- **Description**: Converted into Multi-channel Signed Distance Field (MSDF) bitmap font format for sharp in-engine WebGL text rendering.

---

## 2. Open Source Dependencies

The Lupis Engine editor, backend service, and tooling rely on the following open source libraries:

### Editor & Frontend Dependencies

| Package | License | Copyright / Author | Purpose |
| --- | --- | --- | --- |
| [Vue 3](https://github.com/vuejs/core) | MIT | Evan You | UI framework |
| [Pinia](https://github.com/vuejs/pinia) | MIT | Eduardo San Martin Morote | Editor state management |
| [Vue Router](https://github.com/vuejs/router) | MIT | Evan You | Client-side routing |
| [Lucide](https://github.com/lucide-icons/lucide) | ISC | Lucide Contributors | Editor interface icons |
| [JSZip](https://github.com/Stuk/jszip) | MIT | Stuart Knightley & contributors | Project packaging & zip extraction |
| [Dexie.js](https://github.com/dexie/Dexie.js) | Apache-2.0 | David Fahlander | IndexedDB storage wrapper |
| [idb](https://github.com/jakearchibald/idb) | ISC | Jake Archibald | IndexedDB Promise utilities |
| [PrismJS](https://github.com/PrismJS/prism) | MIT | Lea Verou & contributors | In-editor code syntax highlighting |
| [@vueup/vue-quill](https://github.com/vueup/vue-quill) | MIT | VueUp | Rich text editing |
| [NProgress](https://github.com/rstacruz/nprogress) | MIT | Rico Sta. Cruz | Progress indicator |

### Backend Service & Bundler Dependencies

| Package | License | Copyright / Author | Purpose |
| --- | --- | --- | --- |
| [Express](https://github.com/expressjs/express) | MIT | Express Contributors | HTTP service & bundler API |
| [msdf-bmfont-xml](https://github.com/kbrsh/msdf-bmfont-xml) | MIT | Kabir Shah | MSDF bitmap font generation |
| [Archiver](https://github.com/archiverjs/node-archiver) | MIT | Archiver Contributors | Archive generation for exports |
| [Unzipper](https://github.com/ZJONSSON/node-unzipper) | MIT | Ziggy Jonsson | Archive extraction |
| [Terser](https://github.com/terser/terser) | BSD-2-Clause | Terser Team | JavaScript minification for production builds |
| [Multer](https://github.com/expressjs/multer) | MIT | Hage Yaapa | Multipart form data handling |
| [CORS](https://github.com/expressjs/cors) | MIT | Troy Goode | Cross-origin resource sharing middleware |
| [Electron](https://github.com/electron/electron) | MIT | GitHub Inc. | Desktop application runtime |
| [electron-builder](https://github.com/electron-userland/electron-builder) | MIT | Vladimir Krivosheev | Desktop application packaging & installer |

---

## 3. Licenses

### SIL Open Font License (OFL-1.1)

```
Copyright (c) 2016-2024 The Inter Project Authors (https://github.com/rsms/inter)

This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
https://openfontlicense.org

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Source or Binary forms, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless prominent written permission is granted by the
corresponding Copyright Holder. This restriction only applies to the
primary font name as presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.
```

### MIT License

```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### ISC License

```
Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

### Apache License, Version 2.0

```
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
