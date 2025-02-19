# memo

行列
かけたいものを右におく。行オーダーの場合
ex) translate * rotation * scale * p
https://sites.google.com/site/programmerscheatcheatcheat/shu-xue-wu-li-xuenoyari-zhishi/bian-huan-ping-xing-yi-dong-kuo-suo-hui-zhuan-he-cheng

framebufferにrenderbufferとかtextureを割り当てる
あたりまえだけど、オフスクリーンレンダリングしたいときにrenderTargetにdepthrenderbuffer割り当てないと深度描画されない

lookAtむずい

screen space で uv ずらすとき、ブラウザの場合は画面幅変わるから、画面幅を考慮したoffset値にするべきだと思った

framebufferにrenderbufferを何かしら設定しないとdepthが描画されない？
　
cubemap
http://marcinignac.com/blog/pragmatic-pbr-hdr/

法線行列の導出

逆行列の導出

perspectiveの導出

webglに限らず、uv座標という概念そのものの原点は左下。なのでhtmlから読み込んだimgを合わせるためにはflip_yする
htmlから読み込むと左上が原点なので。

getTexImage2Dするまえにfilterとかflip_yとかを設定。

外積の順番忘れた

lookAtの時、cameraはforwardを逆にする
=> つまり、カメラの背中側がz+になるように。projectionの過程でzが逆になるから。

画像のsamplingの方式忘れた（拡大、縮小時のやつ）

depthの時ってfilterはnearest固定？
あと、texImage2Dのwebgl2の時の使い方が曖昧

骨の計算。
p'(返還後のローカル) = (新しいボーン行列) * ボーンオフセット行列 * p(ローカル)
ボーンオフセット行列 ...すべてのボーンをローカル座標の原点に戻す行列。初期姿勢のボーン行列の累積の逆行列
新しいボーン行列 ... 各ボーン行列の累積
ex) b1 -> b2 -> b3 の構造になってるとすると、
ボーンオフセット行列は (b3 * b2 * b1).invert()
新しいボーン行列は (b3' * b2' * b1')
つまり、p' = (b3' * b2' * b1') * (b3 * b2 * b1).invert() * p;
さらにいえば、クリッピング座標(cp)は cp = projectionMatrix * viewMatrix * worldMatrix * (b3' * b2' * b1') * (b3 * b2 * b1).invert() * p; と出せる
ボーンオフセット行列によってボーンをローカル座標の原点に戻すことで、ボーンごとにボーンを原点としたボーン空間に直すことができる
ボーン空間に直したうえで新しいボーン行列を適用していくことで姿勢変更ができる
