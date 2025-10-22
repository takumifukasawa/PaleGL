# コード圧縮最適化

64KBメガデモのためのコード圧縮最適化の記録

## PrimitiveTypesのリファクタリング (2025-10-22)

### 目的

ビルド後のファイルサイズを削減するため、オブジェクト形式の定数をフラットな個別定数に変換する。

### 背景

JavaScriptのビルド時、オブジェクト構造（`PrimitiveTypes.Triangles`）はフラットな定数（`PRIMITIVE_TYPE_TRIANGLES`）と比較して、以下の理由でファイルサイズが大きくなる：

1. オブジェクトのプロパティアクセスのコードが残る
2. minifyしても完全に最適化されない場合がある
3. Tree-shakingの効果が限定的

### 変更内容

**変更前:**
```typescript
// constants.ts
export const PrimitiveTypes = {
    Points: 0,
    Lines: 1,
    LineLoop: 2,
    LineStrip: 3,
    Triangles: 4,
    TriangleStrip: 5,
    TriangleFan: 6,
} as const;

export type PrimitiveType = (typeof PrimitiveTypes)[keyof typeof PrimitiveTypes];

// 使用例
primitiveType: PrimitiveTypes.Triangles
```

**変更後:**
```typescript
// constants.ts
export const PRIMITIVE_TYPE_POINTS = 0;
export const PRIMITIVE_TYPE_LINES = 1;
export const PRIMITIVE_TYPE_LINE_LOOP = 2;
export const PRIMITIVE_TYPE_LINE_STRIP = 3;
export const PRIMITIVE_TYPE_TRIANGLES = 4;
export const PRIMITIVE_TYPE_TRIANGLE_STRIP = 5;
export const PRIMITIVE_TYPE_TRIANGLE_FAN = 6;

export type PrimitiveType = typeof PRIMITIVE_TYPE_POINTS | typeof PRIMITIVE_TYPE_LINES | typeof PRIMITIVE_TYPE_LINE_LOOP | typeof PRIMITIVE_TYPE_LINE_STRIP | typeof PRIMITIVE_TYPE_TRIANGLES | typeof PRIMITIVE_TYPE_TRIANGLE_STRIP | typeof PRIMITIVE_TYPE_TRIANGLE_FAN;

// 使用例
primitiveType: PRIMITIVE_TYPE_TRIANGLES
```

### 型安全性について

`typeof`を使用した型定義により、以下が保証される：
- 型安全性が保たれる（不正な値を代入できない）
- IDEの補完が効く
- 定数を直接利用できる

### インポートの最適化

使用しない定数はインポートしない方針により、さらなるファイルサイズ削減が可能：

```typescript
// 必要な定数のみインポート
import { PRIMITIVE_TYPE_TRIANGLES } from '@/PaleGL/constants';
```

## 今後の最適化方針

### 同様の最適化が可能な定数群

以下の定数オブジェクトも同様の最適化が可能：

- `BlendTypes`
- `DepthFuncTypes`
- `TextureTypes`
- `TextureWrapTypes`
- `TextureFilterTypes`
- `RenderTargetTypes`
- `MaterialTypes`
- `ActorTypes`
- `MeshTypes`
- `CameraTypes`
- その他、`as const`で定義されているオブジェクト

### 最適化の手順

1. 対象の定数オブジェクトを特定
2. フラットな定数に変換（命名規則: `大文字_スネークケース`）
3. 型定義を`typeof`を使った形式に変更
4. 全参照箇所を検索して置換
5. 各ファイルのインポート文を更新（使用する定数のみインポート）

### 注意点

- 型の使い勝手を損なわないように`typeof`を使用する
- 実行時の動作は変わらない（値は同じ）
- コメントは残す（ビルド時に自動削除される）
