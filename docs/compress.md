# コード圧縮最適化

64KBメガデモのためのコード圧縮最適化の記録

## 定数オブジェクトのフラット化

### 目的・効果

オブジェクト形式の定数を個別定数に変換してファイルサイズを削減：
1. オブジェクトプロパティアクセスコードの削減
2. Tree-shakingの改善（未使用定数が完全削除）
3. Minifyの最適化

### 変換済み (2025-10-23)

**第1回（16個）**: PrimitiveTypes, ShadingModelIds, DepthFuncTypes, BlendTypes, RenderQueueType, RenderQueues, RenderbufferTypes, LightTypes, ActorTypes, MeshTypes, MaterialTypes, UIQueueTypes, UIAnchorTypes, CameraTypes, CubeMapAxis, FaceSide

**第2回（4個）**: TextureTypes, TextureWrapTypes, TextureFilterTypes, TextureDepthPrecisionType

**第3回（2個）**: RenderTargetTypes, RenderTargetKinds

**第4回（1個・19定数）**: UniformTypes (Matrix4, Matrix4Array, Texture, CubeMap, Vector2, Vector2Array, Vector3, Vector3Array, Vector4, Vector4Array, Struct, StructArray, Float, FloatArray, Int, Color, ColorArray, TextureArray, Bool)
  - 主な型推論エラー箇所:
    - 関数の返り値型に `: UniformsData` を追加（例: `generateSkinningUniforms`）
    - 配列リテラルに `as UniformsData` を追加（スプレッド演算子使用時）
    - UniformBufferObjectBlockData配列に型注釈を追加（renderer.ts）
    - `UniformBufferObjectValue`型定義に`UniformBufferObjectStructArrayValue`を追加
  - 修正ファイル数: 約60ファイル
  - 所要時間: 約2時間

**第5回（1個・2定数）**: AnimationKeyframeTypes (Vector3, Quaternion)
  - 修正ファイル数: 2ファイル（loadGLTF.ts, animationKeyframes.ts）
  - 使用箇所: 実質9箇所（コメントアウト除く）
  - 型推論エラー: なし
  - 所要時間: 約10分

**第6回（1個・3定数）**: AttributeUsageType (StaticDraw, DynamicDraw, DynamicCopy)
  - 修正ファイル数: 11ファイル（src: 9ファイル、pages: 2ファイル）
  - 使用箇所: 36箇所（src: 18箇所、pages: 18箇所）
  - 型推論エラー: なし
  - 所要時間: 約15分

## 作業フロー（次回以降用）

### 1. constants.tsで定数を変換
```typescript
// Before
export const XxxTypes = { A: 0, B: 1 } as const;
export type XxxType = (typeof XxxTypes)[keyof typeof XxxTypes];

// After
export const XXX_TYPE_A = 0;
export const XXX_TYPE_B = 1;
export type XxxType = typeof XXX_TYPE_A | typeof XXX_TYPE_B;
```

### 2. 使用箇所を検索
```bash
grep -r "XxxTypes\." src/ pages/
# または
npx tsc --noEmit  # エラーから特定
```

### 3. 各ファイルを修正

**import文の更新:**
```typescript
// Before
import { XxxTypes } from '@/PaleGL/constants';

// After
import { XXX_TYPE_A, XXX_TYPE_B } from '@/PaleGL/constants';
```

**使用箇所の一括置換（Edit tool with replace_all: true）:**
```typescript
XxxTypes.A → XXX_TYPE_A
XxxTypes.B → XXX_TYPE_B
```

### 4. 注意点

- **型と値の区別**: 型名（`XxxType`）は残し、値のみ置換
- **デフォルト引数**: `param = XxxTypes.A` も忘れず置換
- **switch文のcase**: 全て置換対象
- **型アサーション**: GLTFローダー等で型エラーが出たら `as any` で回避
- **型推論エラー対策**: UniformsData等の配列で型エラーが出た場合、`as UniformsData` を追加
- **対象ディレクトリ**: `src/PaleGL/`, `pages/`, `src/pages/scripts/` すべてが対象

### 5. 型推論エラーの対処法

TypeScriptが型を正確に推論できない場合の対処パターン：

**パターンA: 関数の返り値型を明示**
```typescript
// Before
const generateUniforms = () => [
    { name: 'foo', type: UNIFORM_TYPE_FLOAT, value: 1 }
];

// After
const generateUniforms = (): UniformsData => [
    { name: 'foo', type: UNIFORM_TYPE_FLOAT, value: 1 }
];
```

**パターンB: 配列に型アサーション**
```typescript
// Before
uniforms: [
    ...commonUniforms,
    ...customUniforms
]

// After
uniforms: [
    ...commonUniforms,
    ...customUniforms
] as UniformsData
```

**パターンC: 条件分岐の配列に型アサーション**
```typescript
// Before
...(condition ? [{ name: 'x', type: UNIFORM_TYPE_FLOAT, value: 1 }] : [])

// After
...(condition ? ([{ name: 'x', type: UNIFORM_TYPE_FLOAT, value: 1 }] as UniformsData) : [])
```

**パターンD: map結果の型注釈**
```typescript
// Before
value: items.map(item => [...])

// After
value: items.map((): UniformBufferObjectStructValue => [...]) as UniformBufferObjectStructArrayValue
```

### 6. ビルド確認
```bash
npx tsc --noEmit 2>&1 | grep "XxxTypes"
```

### 7. よくあるトラブルシューティング

**問題: 型定義自体にエラーが出る**
```
Type 'UniformBufferObjectStructArrayValue' is not assignable to type 'UniformBufferObjectValue'
```
→ 解決: 型定義（uniforms.ts等）に新しい型をユニオンに追加
```typescript
export type UniformBufferObjectValue =
    | ...existing types...
    | UniformBufferObjectStructArrayValue;  // 追加
```

**問題: setMeshMaterialの引数が足りない**
```
Expected 3-4 arguments, but got 2
```
→ 解決: 第1引数に`gpu`を追加
```typescript
// Before: setMeshMaterial(mesh, material)
// After:  setMeshMaterial(gpu, mesh, material)
```

**問題: プロパティが存在しない**
```
Property 'mrtGraphicsDoubleBuffer' does not exist on type 'GpuParticle'
```
→ 解決: 型定義を確認して正しいプロパティ名を使用
```typescript
// Before: gpuParticle.mrtGraphicsDoubleBuffer.doubleBuffer
// After:  gpuParticle.mrtDoubleBuffer
```

## 今後の最適化候補

constants.tsの他の定数オブジェクト（優先度・規模順）：

### 完了済み
1. ~~`AnimationKeyframeTypes`~~ (完了: 2定数)
2. ~~`AttributeUsageType`~~ (完了: 3定数)

### 優先度: 高（中規模・高頻度）
3. **`PostProcessPassType`** - 20定数、24ファイル、54箇所
   - 推定時間: 30-45分
   - 難易度: ★★☆
   - 理由: ポストプロセス関連で使用頻度が高い

4. **`AttributeNames`** - 18定数、16ファイル、93箇所
   - 推定時間: 30-40分
   - 難易度: ★★☆
   - 理由: ジオメトリ属性で広く使用される

5. **`UniformBlockNames`** - 7定数、29ファイル、86箇所
   - 推定時間: 30-40分
   - 難易度: ★★☆
   - 理由: Uniform Block関連、中規模で影響範囲が明確

### 優先度: 中（大規模・要注意）
6. **`UniformNames`** - 115定数、56ファイル、437箇所 ⚠️
   - 推定時間: 2-3時間
   - 難易度: ★★★
   - 理由: 最大規模、慎重な作業が必要

### 優先度: 低（小規模・低頻度）
7. **`GLTextureFilter`** - 6定数、3ファイル、18箇所
   - 推定時間: 15-20分
   - 難易度: ★☆☆
   - 理由: WebGL定数ラッパー、影響範囲が限定的

8. **`GLTextureWrap`** - 3定数、2ファイル、8箇所
   - 推定時間: 10-15分
   - 難易度: ★☆☆
   - 理由: WebGL定数ラッパー、影響範囲が限定的

9. **`GLColorAttachment`** - 8定数、3ファイル、18箇所
   - 推定時間: 15-20分
   - 難易度: ★☆☆
   - 理由: WebGL定数ラッパー、影響範囲が限定的

### 優先度: 保留（シェーダー関連・影響不明）
10. **`VertexShaderModifierPragmas`** - 13定数、8箇所
    - スプレッド構文使用、要調査
11. **`FragmentShaderModifierPragmas`** - 10定数、14箇所
    - スプレッド構文使用、要調査
12. **`ShaderPragmas`** - スプレッド構文使用、要調査

**推奨作業順序**: 3 → 4 → 5 → 7 → 8 → 9 → 6（最後に大規模なUniformNames）

**作業時間目安**:
- 小規模（～10定数）: 約10-20分
- 中規模（10-20定数）: 約30-45分
- 大規模（100+定数）: 約2-3時間
