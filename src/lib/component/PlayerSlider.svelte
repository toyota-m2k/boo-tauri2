<script lang="ts">
  import {chaptersViewModel} from "$lib/model/ChaptersViewModel.svelte";
  import {playerViewModel} from "$lib/model/PlayerViewModel.svelte";
  import SvgIcon from "$lib/primitive/SvgIcon.svelte";
  import {
    ICON_CHAPTER_ON,
    ICON_CHAPTER_OFF,
  } from "$lib/Icons"
  import {formatTime} from "$lib/utils/Utils";
  import {settings} from "$lib/model/Settings.svelte";
  import type {ColorVariation} from "$lib/model/ModelDef";

  let slider = $state<HTMLInputElement>() as HTMLInputElement

  chaptersViewModel.attach()
  let currentTimePercent = $derived(playerViewModel.duration>0 ? 100*playerViewModel.safeCurrentPosition/playerViewModel.duration : 0)

  let playingOnSeekStart = false
  function onDragStart(_: MouseEvent) {
    playerViewModel.sliderSeeking = true
    playingOnSeekStart = playerViewModel.playing
    if(playingOnSeekStart) {
      playerViewModel.pause()
    }
  }

  function onDragEnd(_: MouseEvent) {
    if(playerViewModel.sliderSeeking) {
      playerViewModel.sliderSeeking = false
      if(playingOnSeekStart) {
        playerViewModel.play()
      }
    }
  }

  let durationText = $derived(formatTime(playerViewModel.safeDuration))
  let currentPositionText = $derived(formatTime(playerViewModel.safeCurrentPosition))


  // つまみの色を変える ... だけのことなのに、一筋縄ではいかないｗ
  //
  // まず、前提条件。
  // 1. つまみの画像は、-webkit-slider-thumb の background-image で指定する。
  // 2. background-image には、pngやsvgなどのファイルパス url(...) を指定する。
  //
  // ここで、色を変えたいので pngではなく、svgを使うが、色は、svgファイルに、pathのfill属性で指定しており、それをcssで変更することができない。
  //  ※svgファイル中に、<path ... fill="var(--color-accent)"/> と書いてみたがＮＧ（黒になった）。
  //
  // 次に、background-image に渡す url を data-url にすることで、scriptブロックで（文字列として）作成したurlを styleブロックに渡す方法を考えた。
  // style ブロックに、scriptブロックの変数を直接書けたら便利なのに、svelteでは、それができないのだな。。。
  // そこで、cssのカスタムプロパティを使って渡す方法、すなわち、scriptブロックで作成したurl文字列を、htmlブロックで、
  // style=でカスタムプロパティをセットし、それを styleブロックで参照する、という遠大な計画。。。
  //
  //    let thumbUrl = `data:image/svg+xml;base64,<svg xmlns=...></svg>}`;
  //    ...
  //    <div style="--thumb-url: url('{thumbUrl}')"></div>
  //    ...
  //    --background-image: var(--thumb-url);
  //
  // うまくいきそうなものだが、SvelteKitが、このURLをurl-encodingしてしまうため、リソースのロードエラーになる。
  //    let thumbUrl = `data:image/svg+xml;base64,${btoa('<svg xmlns=...></svg>')}`;
  // のように、base64エンコードしてみたが、これもダメ。SvelteKitを使う限り、この方法は使えないようだ。
  //
  // --thumb-url をstyleブロック内で定義すれば、ちゃんと background-imageで使われることは確認できているので、
  // 最後の手段として、これを、scriptブロックで取得して、変更し、書き戻す方法を試したところ、うまくいった。
  let cv:ColorVariation|undefined = undefined
  $effect(()=>{
    if(settings.colorVariation !== cv) {
      cv = settings.colorVariation
      // CSSからアクセントカラーを取得 --> # は、%23 にエンコード
      const accentColor = getComputedStyle(slider).getPropertyValue("--color-accent").replace("#", "%23")
      // CSSからつまみの画像URL（styleブロックで定義している）を取得
      const thumbUrl = getComputedStyle(slider).getPropertyValue("--thumb-url")
      // つまみ画像URLの中の色指定をアクセントカラーに置換
      const modifiedThumbUrl = thumbUrl.replace(/fill="%23[0-9A-Fa-f]{6}"/, `fill="${accentColor}"`)
      // つまみ画像URLをCSSに書き戻す
      slider.style.setProperty('--thumb-url', modifiedThumbUrl)
    }
  })

  $inspect(chaptersViewModel.chapters)
//  logger.info(`accentColor=${accentColor}`)
//  let thumbUrl = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="thumb-svg"><path d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z" fill="${accentColor}"/></svg>')}`;
</script>

<!-- Slider with Chapters -->
<div class="slider-control relative w-full h-[55px] mb-[-8px]">
  <div class="slider-with-chapters absolute left-[12px] right-[12px] top-0">
    <div class="slider-bar absolute top-[16px] h-[8px] w-full"
         style="background: linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) {currentTimePercent}%, var(--color-secondary) {currentTimePercent}%, var(--color-secondary) 100%);"
    ></div>
    {#each chaptersViewModel.disabledRanges as range (range.start)}
      <div class="gray-zone absolute top-[16px] h-[8px]"
           style="background: var(--color-gray-500);
             left: {range.start / 10 / playerViewModel.safeDuration}%;
             right: {range.end>0 ? (100 - range.end / 10 / playerViewModel.safeDuration) : 0}%;"
      ></div>
    {/each}
    {#each chaptersViewModel.chapters as chapter (chapter.position)}
      <SvgIcon class="absolute top-0 w-[24px] h-[24px] -translate-x-1/2 focus:outline-0 {(chapter.skip)?'text-gray-100 cursor-default':'text-accent cursor-pointer'}"
               fullSize={false}
               path={chapter.skip ? ICON_CHAPTER_OFF : ICON_CHAPTER_ON}
               style="left: {chapter.position / 10 / playerViewModel.safeDuration}%"
               onclick={()=>chaptersViewModel.gotoChapter(chapter)}
      />
    {/each}
  </div>
  <span class="absolute top-[24px] left-[12px] text-gray-on">{currentPositionText}</span>
  <span class="absolute top-[24px] right-[12px] text-gray-on">{durationText}</span>

  <input class="slider absolute w-full h-[28px] top-[14px] left-0 right-0 bg-transparent appearance-none cursor-pointer focus:outline-0 shadow-none"
         type="range" min="0" max={playerViewModel.safeDuration}
         onmousedown={onDragStart} onmouseup={onDragEnd}
         bind:this={slider}
         bind:value={playerViewModel.currentPosition} step="any"/>
</div>

<style lang="scss">
  :root {
    --thumb-url: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="thumb-svg"><path d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z" fill="%23FF0000"/></svg>');
  }
  .slider {
    // つまみをSVG画像に置き換える
    &::-webkit-slider-thumb {
      appearance: none; // デフォルトのつまみのスタイルを解除
      margin: 8px 0 0;
      //margin: 0; // マージンをなくす
      width: 24px; // 幅
      height: 24px; // 高さ
      border: none; // デフォルトの線を消す
      padding: 0; // 余白をなくす
      cursor: pointer; // カーソルを分かりやすく
      background-image: var(--thumb-url); // 画像を指定
      background-size: cover; // 画像をカバーするように表示
      background-color: transparent; // 背景色を透明に
    }
  }
</style>