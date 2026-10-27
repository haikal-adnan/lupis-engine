---
title: "Context System API"
category: "Visual Scripting"
description: "Referensi lengkap JavaScript untuk objek context runtime yang tersedia di dalam Code Panel. Akses entity, fisika, input, audio, kamera, scene, dan variabel."
---

## Gambaran umum {#overview}

**Context System** (**context**) adalah objek API runtime yang diteruskan ke setiap script node di [Custom Node & Code Panel](visual_scripting/custom_node_and_code). Objek ini menyediakan akses terstruktur dan aman ke entity, fisika, input, audio, kamera, scene, dan variabel selama game berjalan.

:::features
- **Domain Facade**: Mengendalikan entity, collider, channel audio, kamera, dan scene melalui namespace khusus.
- **Status Persisten**: Menyimpan timer, counter, dan flag per node lintas frame di dalam **context.state**.
- **Validasi Cepat**: Memvalidasi entity, komponen, dan angka menggunakan **context.assert** sebelum mengubah status.
- **Contextual Logging**: Mengirimkan pesan bertanda ke **Console** editor menggunakan **context.console** (tag ringkas dan hitungan pengulangan).
:::

## Konsep utama {#key-concepts}

Setiap node yang dijalankan menerima properti dasar pada **context** beserta metode untuk membaca dan menulis [Variabel & Koleksi](visual_scripting/variables_and_collections).

| Properti / Metode | Nilai Balik | Deskripsi |
| --- | --- | --- |
| context.owner | Object | Entity pemilik yang menjalankan komponen [Script Controller](components/script_controller) aktif. |
| context.dt / context.deltaTime | Number | Waktu yang berlalu dalam detik sejak frame sebelumnya. |
| context.state | Object | Objek memori persisten per node yang mempertahankan nilainya lintas frame. |
| context.node | Object | Definisi node yang sedang dijalankan saat ini. |
| context.getLocal(key) | Any | Membaca variabel **Local** dari instance script saat ini. |
| context.setLocal(key, value) | Any | Memperbarui variabel **Local** pada instance script saat ini. |
| context.getGlobal(key) | Any | Membaca variabel **Global** tingkat proyek. Menghasilkan error jika **key** belum didefinisikan. |
| context.setGlobal(key, value) | Any | Memperbarui variabel **Global** tingkat proyek di seluruh scene. |
| context.getVariable(key) | Any | Mencari di scope **Local** terlebih dahulu, lalu beralih ke scope **Global** jika tidak ditemukan. |
| context.hasVariable(key) | Boolean | Mengembalikan **true** jika **key** tersedia di scope **Local** atau **Global**. |

Gunakan lifecycle hook, pemicu alur, pemeriksaan validasi, dan namespace logging untuk mengatur eksekusi serta memeriksa status saat game berjalan.

| Namespace / Method | Metode Utama | Deskripsi |
| --- | --- | --- |
| context.triggerFlow(portName) | triggerFlow('execOut') | Memicu pin output eksekusi bernama (seperti **onTrue** atau **onCollected**). |
| context.onTick(callback) | onTick(callback) | Mendaftarkan fungsi pembaruan per frame yang menerima delta time (dt). |
| Lifecycle Callbacks | onGameStart, onSceneStart, onGamePause, onGameResume, onGameRestart, onGameQuit | Mendaftarkan fungsi yang dijalankan saat status game atau scene aktif berubah. |
| context.lifecycle | pause(), resume(), restart(), quit(), isPaused() | Menjeda, melanjutkan, memulai ulang, atau menghentikan sesi game yang sedang berjalan. |
| context.signal | emit(signalName, data?), on(signalName, callback) | Memancarkan dan mendengarkan event khusus lintas entity dan script yang terpisah. |
| context.assert | exists(val, msg?), hasComponent(entity, name, msg?), isNumber(val, msg?), isString(val, msg?), isBoolean(val, msg?), isObject(val, msg?), isArray(val, msg?), inRange(val, min, max, msg?), isTrue(cond, msg?), isFalse(cond, msg?), fail(msg?) | Memvalidasi syarat data dan langsung menghentikan node dengan pesan error di **Console** jika pemeriksaan gagal. |
| context.console | log(...args), warn(...args), error(...args) | Mencatat pesan ke panel **Console** dengan badge konteks ringkas ([entity::script]), tooltip saat disentuh, dan deduplikasi pesan berulang. |
| context.ui | notify(message, source?, type?), isUiLayer(layerId), dispatchEvent(event) | Menampilkan notifikasi singkat di editor dan memeriksa layer user interface (UI) screen-space. |

> [!NOTE]
> Selalu validasi input dan entity yang wajib ada menggunakan **context.assert.exists()** atau **context.assert.isNumber()**. Jika sebuah pemeriksaan gagal, engine menghentikan node tersebut dengan aman dan mencatat lokasi persis nodenya di panel **Console**.

## Cara kerja {#how-it-works}

Di dalam **Code Panel**, script node mengikuti pola yang konsisten untuk membaca input, memanggil domain facade engine, dan meneruskan hasilnya ke node berikutnya.

:::steps
1. Baca port input dari **inputs** dan validasi nilai yang dibutuhkan menggunakan **context.assert**.
2. Ambil [entity](components/entities_and_prefabs) tujuan menggunakan **context.entity.get(inputs.targetEntity)** (berikan nilai **'self'** untuk menargetkan **context.owner**).
3. Panggil domain facade yang sesuai (seperti **context.collider**, **context.input**, atau **context.audio**) untuk memeriksa atau memperbarui dunia game.
4. Simpan timer atau counter lintas frame di dalam **context.state**.
5. Isi port output pada **outputs**, atur **outputs.execOut = true;** (untuk node **Action** dan **Event**), lalu akhiri dengan **return;**.
:::

Gunakan facade spasial, hierarki, fisika, dan input berikut untuk berinteraksi dengan entity di dalam scene aktif.

| Domain Facade | Metode dan Properti yang Tersedia | Deskripsi |
| --- | --- | --- |
| context.entity | get(targetId), destroy(entity), destroyByTag(tag), clone(entity), getParent(entity), getChildren(entity), getRoot(entity), findClosestByTag(tag, origin, y?), getAllByTag(tag), findByName(name), findByScriptId(scriptId) | Mengambil entity berdasarkan **'self'**, UUID, atau **scriptId**, menelusuri parent-child tree, memeriksa tag, serta menggandakan atau menghapus entity. |
| context.prefab | spawn(prefabAssetId, x?, y?, layerId?, parentId?) | Men-spawn instance prefab baru ke dalam scene pada koordinat **(x, y)**. |
| context.layer | get(layerId), destroy(layerId, destroyEntities?), freezeInput(layerId, active?, type?), isInputFrozen(layerId, type?) | Mengambil layer tampilan, menghapus layer, atau membekukan input kursor dan keyboard pada layer tertentu. |
| context.collider | moveAndSlide(entity, moveX, moveY), checkSolid(entity), checkOverlap(entity, filterTag?) | Menggerakkan entity dengan wall sliding serta memeriksa solid collision atau overlap trigger pada bentuk [Multi-Collider](components/multi_collider). |
| context.input | getPointer(), mouse, keyboard.isDown(key), keyboard.isPressed(key), keyboard.isReleased(key), raycast.getTopEntity(), isPointerOver(entity, useRaycast?) | Membaca koordinat kursor, tombol mouse, status keyboard, dan entity dengan Z-Index tertinggi di bawah kursor. |

Gunakan facade tampilan, audio, scene, dan toolkit game berikut untuk mengendalikan kamera, channel audio, transisi scene, serta mekanika tingkat tinggi.

| Domain Facade | Metode dan Properti yang Tersedia | Deskripsi |
| --- | --- | --- |
| context.camera | follow(targetEntity, speed?, offset?), stopFollow(), snapTo(x, y), setTransform(x, y, scale?, speed?), getInfo(), x, y, scale, lerp | Mengikuti entity tujuan secara halus, memindahkan kamera secara instan, atau menyesuaikan perbesaran dan posisi viewport. |
| context.audio | play(targetOrAssetId, options?), stop(targetOrId), stopAll(), setVolume(channel, volume), getVolume(channel), setMute(channel, isMute), isMuted(channel) | Memutar atau menghentikan suara [Audio Source](components/audio_source) serta mengatur channel mixer **master**, **background**, **sfx**, dan **voice** (0 hingga 100). |
| context.transition | fade(mode, duration, color, onComplete?) | Menjalankan transisi fade layar penuh (**'fade_in'**, **'fade_out'**, atau **'fade'**). |
| context.scene | load(sceneName), restart(), getCurrentName(), getCurrentId(), getCurrentData(), getAllScenes(), injectLayer(sceneName, layerName, inheritState?, targetLayer?) | Berpindah atau memuat ulang scene serta meng-inject layer dari scene lain (seperti layer HUD bersama). |
| context.asset | get(idOrScriptId), resolveId(idOrScriptId) | Mengambil metadata asset proyek atau mengubah **scriptId** asset menjadi UUID. |
| context.toolkit | platformer, combat, ai, collectable, dialogue | Fungsi bantu tingkat tinggi yang digunakan oleh node preset dan template di [Helper & Tool](node_library/helper_tool). |

> [!WARNING]
> Jangan pernah mengakses **context.game** di dalam script node. Validator **Code Panel** menandai properti dasar yang tidak dikenali dan mewajibkan akses melalui domain facade **context** yang terdokumentasi.

## Contoh {#example}

Custom node ini mengambil entity tujuan, menggerakkannya secara horizontal menggunakan input keyboard serta **context.collider.moveAndSlide()**, lalu mencatat total jarak tempuh di dalam **context.state**:

```javascript
const speed = context.assert.isNumber(inputs.speed, 'Speed must be a number');
const entity = context.assert.exists(
  context.entity.get(inputs.targetEntity),
  'Target entity not found'
);

const dir = (context.input.keyboard.isDown('KeyD') ? 1 : 0) - (context.input.keyboard.isDown('KeyA') ? 1 : 0);
const moveX = dir * speed * context.dt;
context.collider.moveAndSlide(entity, moveX, 0);

context.state.distance = (context.state.distance || 0) + Math.abs(moveX);
outputs.totalDistance = context.state.distance;
outputs.execOut = true;
return;
```

Cuplikan kode ini memperbarui variabel global, memutar efek suara melalui **context.audio**, dan memancarkan sinyal menggunakan **context.signal.emit()**:

```javascript
const points = context.assert.isNumber(inputs.points, 'Points must be a number');
const nextScore = context.getGlobal('Score') + points;

context.setGlobal('Score', nextScore);
context.audio.play(inputs.sfxAssetId);
context.signal.emit('scoreChanged', nextScore);

outputs.newScore = nextScore;
outputs.execOut = true;
return;
```

## Terkait {#related}

| Halaman | Gunakan saat |
| --- | --- |
| [Custom Node & Code Panel](visual_scripting/custom_node_and_code) | Kamu ingin membuat Custom Node, menambahkan port, dan mengedit kode JavaScript di Code Panel. |
| [Konsep Graph & Node](visual_scripting/graph_concepts) | Kamu ingin mempelajari cara kerja pin eksekusi, port data, dan peran node. |
| [Variabel & Koleksi](visual_scripting/variables_and_collections) | Kamu ingin mendefinisikan variabel Local dan Global di Variable Manager. |
| [Overview & Architecture](node_library/overview) | Kamu ingin melihat bagaimana node bawaan menggunakan Context System API. |
