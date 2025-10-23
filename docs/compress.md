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

### 5. ビルド確認
```bash
npx tsc --noEmit 2>&1 | grep "XxxTypes"
```

## 今後の最適化候補

constants.tsの他の定数オブジェクト（優先度順）：

1. `UniformTypes` - 使用頻度高
2. `AnimationKeyframeTypes`
3. `AttributeUsageType`
4. `PostProcessPassType`
5. `UniformNames` - 大量（慎重に）
6. `UniformBlockNames`

**作業時間目安**: 1つの定数オブジェクトあたり約15-30分

---

## [作業予定] 第4回：UniformTypes（19個）

### 対象定数（constants.ts:278-298）
Matrix4, Matrix4Array, Texture, CubeMap, Vector2, Vector2Array, Vector3, Vector3Array, Vector4, Vector4Array, Struct, StructArray, Float, FloatArray, Int, Color, ColorArray, TextureArray, Bool

### 変換パターン
```typescript
// Before
export const UniformTypes = {
    Matrix4: 0,
    // ... 19個
} as const;

// After
export const UNIFORM_TYPE_MATRIX4 = 0;
export const UNIFORM_TYPE_MATRIX4_ARRAY = 1;
// ... 19個の個別定数
export type UniformTypes = typeof UNIFORM_TYPE_MATRIX4 | typeof UNIFORM_TYPE_MATRIX4_ARRAY | ...;
```

### 使用箇所（約70ファイル、1000+箇所）
**コアシステム:**
- `core/gpu.ts` (~40箇所) - uniform設定処理
- `core/renderer.ts` (~100箇所) - レンダラーのuniform定義
- `core/uniformBufferObject.ts` (~20箇所)
- `core/uniforms.ts` (~10箇所)

**マテリアル系 (~10ファイル):**
- `materials/material.ts`, `gBufferMaterial.ts`, `unlitMaterial.ts`, `objectSpaceRaymarchMaterial.ts` など

**ポストプロセス系 (~15ファイル):**
- `postprocess/*.ts` - 各種パス（bloom, dof, ssr, fog, lightShaft, streak等）

**アクター系:**
- `actors/meshes/*.ts` - skinnedMesh, skybox, charMesh等
- `actors/particles/*.ts` - gpuParticle, gpuTrailParticle等

**その他:**
- `pages/*.ts`, `src/pages/scripts/*.ts`
- `demos/`配下のビルド済みファイル（再ビルドで対応）

### 置換パターン（19個すべて）
- `UniformTypes.Matrix4` → `UNIFORM_TYPE_MATRIX4`
- `UniformTypes.Matrix4Array` → `UNIFORM_TYPE_MATRIX4_ARRAY`
- `UniformTypes.Texture` → `UNIFORM_TYPE_TEXTURE`
- `UniformTypes.CubeMap` → `UNIFORM_TYPE_CUBE_MAP`
- `UniformTypes.Vector2` → `UNIFORM_TYPE_VECTOR2`
- `UniformTypes.Vector2Array` → `UNIFORM_TYPE_VECTOR2_ARRAY`
- `UniformTypes.Vector3` → `UNIFORM_TYPE_VECTOR3`
- `UniformTypes.Vector3Array` → `UNIFORM_TYPE_VECTOR3_ARRAY`
- `UniformTypes.Vector4` → `UNIFORM_TYPE_VECTOR4`
- `UniformTypes.Vector4Array` → `UNIFORM_TYPE_VECTOR4_ARRAY`
- `UniformTypes.Struct` → `UNIFORM_TYPE_STRUCT`
- `UniformTypes.StructArray` → `UNIFORM_TYPE_STRUCT_ARRAY`
- `UniformTypes.Float` → `UNIFORM_TYPE_FLOAT`
- `UniformTypes.FloatArray` → `UNIFORM_TYPE_FLOAT_ARRAY`
- `UniformTypes.Int` → `UNIFORM_TYPE_INT`
- `UniformTypes.Color` → `UNIFORM_TYPE_COLOR`
- `UniformTypes.ColorArray` → `UNIFORM_TYPE_COLOR_ARRAY`
- `UniformTypes.TextureArray` → `UNIFORM_TYPE_TEXTURE_ARRAY`
- `UniformTypes.Bool` → `UNIFORM_TYPE_BOOL`

### 作業ステップ
1. constants.tsの定数を変換
2. TypeScriptエラーで影響範囲を確認
3. 優先度順に各ファイルを修正:
   - import文更新
   - replace_all: trueで一括置換（各定数ごと）
4. 段階的にtsc --noEmitで確認
5. 全修正後に最終ビルド確認

### 注意事項
- 型名 `UniformTypes` は残す（値のみ置換）
- switch文のcase、デフォルト引数、型定義すべて対象
- 使用頻度が最も高いため、他の作業より時間がかかる見込み

### 推定作業時間
60-90分（ファイル数・使用箇所が多いため）

---

※この作業予定セクションは作業完了後に削除予定
