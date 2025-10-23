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

**第7回（1個・20定数）**: PostProcessPassType (Bloom, DepthOfField, BufferVisualizer, ChromaticAberration, Glitch, GaussianBlur, Copy, FXAA, LightShaft, DeferredShading, ScreenSpaceShadow, SSAO, SSR, Streak, ToneMapping, Vignette, VolumetricLight, Fragment, Fog, FragmentPass)
  - 修正ファイル数: 24ファイル（postprocess: 21ファイル、utilities: 1ファイル、pages/scripts: 1ファイル、Marionetter: コメントのみ）
  - 使用箇所: 約57箇所（実コード51箇所、コメント6箇所）
  - 主要パターン:
    - 型アノテーション: 18箇所（各パスファイルの`type:`プロパティ）
    - オブジェクトキー: 27箇所（postProcessPassBehaviours.tsの動的ビヘイビア定義）
    - 条件判定: 2箇所（initDebugger.ts）
  - 型推論エラー: なし
  - 所要時間: 約30分

**第8回（1個・18定数）**: AttributeNames (Position, Color, Uv, Normal, Tangent, Binormal, BoneIndices, BoneWeights, InstancePosition, InstanceScale, InstanceRotation, InstanceAnimationOffset, InstanceVertexColor, InstanceEmissiveColor, InstanceVelocity, InstanceLookDirection, InstanceState, TrailIndex)
  - 修正ファイル数: 16ファイル（src: 14ファイル、pages: 2ファイル）
  - 使用箇所: 約93箇所
  - 主要修正箇所:
    - geometries: 3ファイル（boxGeometry, planeGeometry, createSphereGeometry）
    - loaders: 1ファイル（loadObj）
    - actors/meshes: 6ファイル（arrowHelper, axesHelper, billboardParticle, skinnedMesh, skybox※コメントのみ）
    - actors/cameras: 1ファイル（cameraBehaviours）
    - actors/particles: 2ファイル（instancingParticle, gpuTrailParticle）
    - postprocess: 1ファイル（volumetricLightPass）
    - utilities: 1ファイル（stats）
    - pages: 2ファイル（street-light/main, sandbox/main）
  - 型推論エラー: なし
  - 所要時間: 約30-35分

**第9回（3個・17定数）**: GLTextureFilter (6定数), GLTextureWrap (3定数), GLColorAttachment (8定数)
  - 修正ファイル数: 4ファイル（constants.ts, texture.ts, cubeMap.ts, renderTarget.ts, gBufferRenderTargets.ts）
  - 使用箇所: 44箇所（GLTextureFilter: 18箇所、GLTextureWrap: 8箇所、GLColorAttachment: 18箇所）
  - 主要修正箇所:
    - core/texture.ts: GLTextureFilter 15箇所、GLTextureWrap 6箇所
    - core/cubeMap.ts: GLTextureFilter 2箇所、GLTextureWrap 2箇所
    - core/renderTarget.ts: GLTextureFilter 2箇所、GLColorAttachment 6箇所
    - core/gBufferRenderTargets.ts: GLColorAttachment 4箇所
    - constants.ts: GLColorAttachments配列 8箇所
  - 型推論エラー: なし
  - 所要時間: 約20分

**第10回（1個・7定数）**: UniformBlockNames (Common, Transformations, Camera, DirectionalLight, SpotLight, PointLight, Timeline)
  - 修正ファイル数: 30ファイル（src: 27ファイル、pages: 2ファイル、root/src: 1ファイル）
  - 使用箇所: 約86箇所
  - 主要修正箇所:
    - postprocess: 10ファイル（volumetricLightPass, glitchPass, ssrPass, ssaoPass, depthOfFieldPass, screenSpaceShadowPass, deferredShadingPass, fogPass 他）
    - materials: 7ファイル（unlitMaterial, screenSpaceRaymarchMaterial, objectSpaceRaymarch系, gBufferMaterial）
    - core: 3ファイル（graphicsDoubleBuffer, effectTexture, renderer）
    - actors/meshes: 7ファイル（unlitShapeTextMesh, uiShapeTextMesh, charMesh, arrowHelper, billboardParticle, screenSpaceRaymarchMesh, skybox）
    - pages: 2ファイル（street-light/main, sandbox/main）
    - root/src/pages/scripts: 1ファイル（testBackground）
  - 型推論エラー: なし
  - 所要時間: 約35-40分

**第11回（1個・13定数）**: VertexShaderModifierPragmas (LOCAL_POSITION_POST_PROCESS, VERTEX_COLOR_POST_PROCESS, INSTANCE_TRANSFORM_PRE_PROCESS, WORLD_POSITION_POST_PROCESS, VIEW_POSITION_POST_PROCESS, OUT_CLIP_POSITION_PRE_PROCESS + ShaderModifierPragmas 7定数)
  - 修正ファイル数: 2ファイル（sandbox/main.ts, buildShader.ts）
  - 使用箇所: 8箇所（実質3箇所、コメントアウト5箇所含む）
  - 主要修正箇所:
    - pages/labs/sandbox/main.ts: import更新、オブジェクトキー1箇所、配列3箇所
    - core/buildShader.ts: import更新、Object.values()を配列リテラルに置換
  - 特記事項: Object.values()を13個の定数を列挙した配列リテラルに置換
  - 型推論エラー: なし
  - 所要時間: 約10分

**第12回（1個・10定数）**: FragmentShaderModifierPragmas (BLOCK_BEFORE_RAYMARCH_CONTENT, BEFORE_OUT, AFTER_OUT + ShaderModifierPragmas 7定数)
  - 修正ファイル数: 12ファイル（src: 8ファイル、pages: 3ファイル、buildShader: 1ファイル）
  - 使用箇所: 18箇所（実質16箇所、コメントアウト2箇所含む）
  - 主要修正箇所:
    - src/pages/scripts: 3ファイル（testBackground 2箇所、sceneBuilder 1箇所、createHuman 1箇所）
    - materials: 4ファイル（objectSpaceRaymarch系 各2箇所）
    - actors/meshes: 1ファイル（screenSpaceRaymarchMesh 2箇所）
    - pages: 3ファイル（main 1箇所コメント、street-light/main 1箇所、morph-glass/main 2箇所）
    - core/buildShader.ts: Object.values()を配列リテラルに置換
  - 特記事項: Object.values()を10個の定数を列挙した配列リテラルに置換
  - 型推論エラー: なし
  - 所要時間: 約30分

**第13回（1個・9定数）**: ShaderPragmas (DEFINES, ATTRIBUTES + ShaderModifierPragmas 7定数)
  - 修正ファイル数: 1ファイル（buildShader.ts）
  - 使用箇所: 2箇所
  - 主要修正箇所:
    - core/buildShader.ts: DEFINES、ATTRIBUTES の2箇所を置換
  - 特記事項: ShaderPartialPragmasは現在空（将来の拡張用）のためnever型に設定
  - 型推論エラー: なし
  - 所要時間: 約5分

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
3. ~~`PostProcessPassType`~~ (完了: 20定数)
4. ~~`AttributeNames`~~ (完了: 18定数)
5. ~~`GLTextureFilter`~~ (完了: 6定数)
6. ~~`GLTextureWrap`~~ (完了: 3定数)
7. ~~`GLColorAttachment`~~ (完了: 8定数)
8. ~~`UniformBlockNames`~~ (完了: 7定数)
9. ~~`VertexShaderModifierPragmas`~~ (完了: 13定数)
10. ~~`FragmentShaderModifierPragmas`~~ (完了: 10定数)
11. ~~`ShaderPragmas`~~ (完了: 9定数)

### 優先度: 高（大規模・要注意）

12. **`UniformNames`** - 115定数、56ファイル、437箇所 ⚠️
   - 推定時間: 2-3時間
   - 難易度: ★★★
   - 理由: 最大規模、慎重な作業が必要

**推奨作業順序**: 12（UniformNames）が最後の大きな作業

**作業時間目安**:
- 小規模（～10定数）: 約10-20分
- 中規模（10-20定数）: 約30-45分
- 大規模（100+定数）: 約2-3時間
