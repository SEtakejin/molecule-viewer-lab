# 分子構造ラボ

水分子、水の六員環、メタン、二酸化炭素、ベンゼン、氷の水素結合ネットワークをブラウザーで360度観察する静的Webアプリです。

## 主な機能

- ボール＆スティック／空間充填／ワイヤーフレーム表示
- 原子名、結合角、水素結合、非共有電子対の表示切替
- 日本語リクエスト入力
- 自動回転、ズーム、移動、全画面
- PNG画像保存
- URLパラメータによる表示状態の共有
- PC、タブレット、スマートフォン対応

## 収録モデル

- 水分子 H₂O
- 水分子の電子対四面体
- 水の六員環（環状水六量体）
- メタン CH₄
- 二酸化炭素 CO₂
- ベンゼン C₆H₆
- 氷の六方晶ネットワーク（模式図）

`models/`には、以前作成した水分子四面体と環状水六量体のGLBデータも参考資料として収録しています。Web表示本体は、表示切替と拡張を容易にするため、`js/molecule-data.js`の原子座標データから描画します。

## URL例

```text
?molecule=water-tetrahedron&style=ballstick&pairs=1&angles=1
?molecule=water-hexamer&style=ballstick&hbonds=1
?molecule=benzene&style=spacefill
```

## 公開方法

GitHub Pagesの公開元を`main`ブランチの`/ (root)`に設定します。ビルド処理は不要です。

## 技術

- Three.js 0.180.0
- OrbitControls
- CSS2DRenderer
- GitHub Pages

## 注意

本アプリは構造理解を目的とする教育用モデルです。氷のネットワークなど一部は模式表現であり、結晶解析・量子化学計算用の厳密データではありません。
