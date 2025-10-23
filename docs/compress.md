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

1. `RenderTargetTypes` - 使用頻度高
2. `UniformTypes` - 使用頻度高
3. `RenderTargetKinds`
4. `AnimationKeyframeTypes`
5. `AttributeUsageType`
6. `PostProcessPassType`
7. `UniformNames` - 大量（慎重に）
8. `UniformBlockNames`

**作業時間目安**: 1つの定数オブジェクトあたり約15-30分
