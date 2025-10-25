# Terser Property Mangling Tests

このディレクトリには Terser の property mangling 機能をテストするためのスクリプトが含まれています。

## テストファイル

### 基本テスト
- `test-terser-api.js` / `test-terser-api.mjs` - Terser API の基本動作確認
- `test-terser-debug.mjs` - デバッグ用

### Property Mangling テスト
- `test-props-true.mjs` - `properties: true` のテスト（プレフィックスなし）
- `test-props-true-underscore.mjs` - `properties: true` + `_` プレフィックスのテスト
- `test-terser-underscore.mjs` - `_` プレフィックスのマングリング確認

### keep_quoted テスト
- `test-strict-quoted.mjs` - `keep_quoted: "strict"` の動作確認

## 実行方法

```bash
# 個別実行
node PaleGL/tests/terser/test-props-true.mjs

# 全テスト実行
for file in PaleGL/tests/terser/test-*.mjs; do
  echo "=== $file ==="
  node "$file"
done
```

## 判明した事実

### Terser Property Mangling の仕様

1. **`_` または `$` プレフィックスが必須**
   - `properties: true` でも、プレフィックスなしのプロパティはマングリングされない
   - `regex: /^[a-zA-Z]/` は無効（ドキュメントと異なる）

2. **動作するパターン**
   ```javascript
   const obj = {_name: "test", _type: 1};
   // → {o:"test", j:1}  ✅ マングリングされる
   ```

3. **動作しないパターン**
   ```javascript
   const obj = {name: "test", type: 1};
   // → {name:"test", type:1}  ❌ マングリングされない
   ```

## 参考資料

- [docs/compression-analysis.md セクション14](../../../docs/compression-analysis.md)
- [Terser Documentation](https://terser.org/docs/api-reference)
