/**
 * Cargo.toml と Cargo.lock のバージョン番号を package.json の version に揃える。
 *
 * このプロジェクトは Tauri 2 (Rust) + SvelteKit (npm) のハイブリッド構成で、
 * バージョン番号を以下の3ファイルが要求する:
 *   1. package.json                            ← npm パッケージとして必須
 *   2. src-tauri/Cargo.toml ([package].version) ← Cargo (Rust) として必須
 *   3. src-tauri/Cargo.lock の bootauri2 エントリ ← Cargo が自動生成、上記と一致必須
 *
 * src-tauri/tauri.conf.json の "version" フィールドは "../package.json" という
 * パス文字列を指定してあり、Tauri が読み込み時に package.json から動的に
 * version を取得するため、ここには静的なバージョン番号を持たない。
 *   - Tauri 2 仕様: "version" の値が "package.json" で終わる文字列の場合、
 *     そのファイルを読みに行く。
 *
 * 運用フロー:
 *   $ npm --ignore-scripts=false version 0.14.0   （または patch / minor / major）
 *   1. npm が package.json の version を書き換える
 *   2. package.json の "scripts.version" 経由でこのスクリプトが起動
 *   3. Cargo.toml と Cargo.lock を package.json の version に同期
 *   4. 同期したファイルを git add （"scripts.version" 側のコマンドで実施）
 *   5. npm が「(new version)」コミットと v0.14.0 タグを作る
 *      → 1〜4 で書き換えた全ファイルが1つのコミットに収まる
 *
 * 重要: .npmrc に `ignore-scripts=true` を入れているため、`npm version` の
 * lifecycle hook (preversion/version/postversion) はそのままだと走らない。
 * 上記コマンド例の `--ignore-scripts=false` で 1 回限りそれを無効化する。
 * これを忘れると package.json だけ書き換わり Cargo.toml/lock が古いまま
 * コミットされる事故になる（0.13.5 への bump 時に一度発生した）。
 *
 * 直接 Cargo.toml / Cargo.lock を編集してもよいが、その場合は手動で
 * package.json と一致させること。CI 等で食い違いを検知したい場合は
 * このスクリプトを --check フラグ付きで呼ぶような拡張も可。
 */

import {readFileSync, writeFileSync} from "node:fs"
import {fileURLToPath} from "node:url"
import {dirname, join, relative} from "node:path"

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, "..")

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))
const newVersion = pkg.version
if (!/^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/.test(newVersion)) {
  console.error(`sync-version: invalid semver "${newVersion}" in package.json`)
  process.exit(1)
}

function rewrite(absPath, pattern, replacement) {
  const before = readFileSync(absPath, "utf8")
  // 「正規表現がマッチしない」と「マッチするが同じ値で置換」を区別する。
  // 前者は同期対象が見つからない不整合（エラー）、後者は既に揃っている (no-op)。
  if (!pattern.test(before)) {
    console.error(`sync-version: pattern not found in ${absPath}`)
    process.exit(1)
  }
  const after = before.replace(pattern, replacement)
  if (after === before) {
    console.log(`sync-version: ${relative(root, absPath)} already at ${newVersion}`)
    return
  }
  writeFileSync(absPath, after)
  console.log(`sync-version: ${relative(root, absPath)} -> ${newVersion}`)
}

// Cargo.toml: [package] セクション直下の最初の version 行を書き換える。
// 他の依存 crate のバージョン指定行と衝突しないよう [package] スコープ限定。
rewrite(
  join(root, "src-tauri", "Cargo.toml"),
  /(^\[package\][\s\S]*?^version = ")[^"]+(")/m,
  `$1${newVersion}$2`,
)

// Cargo.lock: bootauri2 (= 本クレート) エントリの version 行を書き換える。
// Cargo.lock 内の他パッケージと混同しないよう name="bootauri2" 直後のものだけを対象。
rewrite(
  join(root, "src-tauri", "Cargo.lock"),
  /(name = "bootauri2"\r?\nversion = ")[^"]+(")/,
  `$1${newVersion}$2`,
)
