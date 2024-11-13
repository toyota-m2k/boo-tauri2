<script lang="ts">
  import {chaptersViewModel} from "$lib/model/ChaptersViewModel.svelte";
  import {playerViewModel} from "$lib/model/PlayerViewModel.svelte";
  import SvgIcon from "$lib/primitive/SvgIcon.svelte";
  import {
    ICON_PIN,
    ICON_PIN_OFF,
  } from "$lib/Icons"
  import {formatTime} from "$lib/utils/Utils";
  import {logger} from "$lib/model/DebugLog.svelte";

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
  // ちょっとトリッキーな方法で、つまみの色を変える
  // つまみの色をスタイルシートだけで変えようとしたが -webkit-slider-thumb で、colorを指定しても効かなかった。
  // もともと、svgファイルのurlを渡していたため細工できなかったが、その中味の文字列を data url にして、
  // styleで、カスタムプロパティ(--thumb-url)経由で、<style>に渡す方法が見つかった。
  // これにより、cssから取得した色を、文字列置換で　fill に指定することが可能になった。
  const accentColor = getComputedStyle(document.documentElement).getPropertyValue("--color-accent").replace("#", "%23")
  logger.info(`accentColor=${accentColor}`)
  let thumbUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="thumb-svg"><path d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z" fill="${accentColor}"/></svg>`
</script>

<!-- Slider with Chapters -->
<div class="slider-control relative w-full h-[55px] mb-[-10px]" style="--thumb-url: url('{thumbUrl}')"
>
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
               path={chapter.skip ? ICON_PIN_OFF : ICON_PIN}
               style="left: {chapter.position / 10 / playerViewModel.safeDuration}%"
               onclick={()=>chaptersViewModel.gotoChapter(chapter)}
      />
    {/each}
  </div>
  <span class="absolute top-[24px] left-[12px] text-gray-on">{formatTime(playerViewModel.safeCurrentPosition)}</span>
  <span class="absolute top-[24px] right-[12px] text-gray-on">{formatTime(playerViewModel.safeDuration)}</span>

  <input class="slider absolute w-full h-[28px] top-[14px] left-0 right-0 bg-transparent appearance-none cursor-pointer focus:outline-0 shadow-none"
         type="range" min="0" max={playerViewModel.safeDuration}
         onmousedown={onDragStart} onmouseup={onDragEnd}
         bind:value={playerViewModel.currentPosition} step="any"/>
</div>

<style lang="scss">
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