<script lang="ts">
  import {chaptersViewModel} from "$lib/model/ChaptersViewModel.svelte";
  import {playerViewModel} from "$lib/model/PlayerViewModel.svelte";
  import SvgIcon from "$lib/primitive/SvgIcon.svelte";
  import {
    ICON_PIN,
    ICON_PIN_OFF,
  } from "$lib/Icons"
  import {formatTime} from "$lib/utils/Utils";

  chaptersViewModel.attach()
  let currentTimePercent = $derived(100*playerViewModel.currentPosition/playerViewModel.duration)

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
</script>

<!-- Slider with Chapters -->
<div class="slider-control relative w-full h-[55px]">
  <div class="slider-with-chapters absolute left-[12px] right-[12px] top-0 bg-pink-500">
    <div class="slider-bar absolute top-[16px] h-[8px] w-full"
         style="background: linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) {currentTimePercent}%, var(--color-secondary) {currentTimePercent}%, var(--color-secondary) 100%);"
    ></div>
    {#each chaptersViewModel.disabledRanges as range (range.start)}
      <div class="gray-zone absolute top-[16px] h-[8px]"
           style="background: var(--color-gray-500);
             left: {range.start / 10 / playerViewModel.duration}%;
             right: {range.end>0 ? (100 - range.end / 10 / playerViewModel.duration) : 0}%;"
      ></div>
    {/each}
    {#each chaptersViewModel.chapters as chapter (chapter.position)}
      <SvgIcon class="absolute top-0 w-[24px] h-[24px] -translate-x-1/2 focus:outline-0 {(chapter.skip)?'text-gray-100 cursor-default':'text-accent cursor-pointer'}"
               path={chapter.skip ? ICON_PIN_OFF : ICON_PIN}
               style="left: {chapter.position / 10 / playerViewModel.duration}%"
               onclick={()=>chaptersViewModel.gotoChapter(chapter)}
      />
    {/each}
  </div>
  <span class="absolute top-[24px] left-[12px] text-gray-200">{formatTime(playerViewModel.currentPosition)}</span>
  <span class="absolute top-[24px] right-[12px] text-gray-200">{formatTime(playerViewModel.duration)}</span>

  <input class="slider absolute w-full h-[28px] top-[14px] left-0 right-0 bg-transparent appearance-none cursor-pointer focus:outline-0 shadow-none" type="range" min="0" max={playerViewModel.duration}
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
      background-image: url('./thumb.svg'); // SVG画像のパスを指定
      background-size: cover; // 画像をカバーするように表示
      background-color: transparent; // 背景色を透明に
    }
  }

</style>