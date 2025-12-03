// 音乐管理器
let bgmAudio = null
let sfxAudio = null
let bgmEnabled = true
let sfxEnabled = true

// 初始化音乐
export const initAudio = () => {
  // 背景音乐 - 使用免费音乐 URL
  bgmAudio = new Audio()
  bgmAudio.loop = true
  bgmAudio.volume = 0.3

  // 音效
  sfxAudio = new Audio()
  sfxAudio.volume = 0.5
}

// 播放背景音乐
export const playBGM = (url = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3') => {
  if (!bgmAudio) initAudio()
  if (bgmEnabled) {
    bgmAudio.src = url
    bgmAudio.play().catch(() => {})
  }
}

// 停止背景音乐
export const stopBGM = () => {
  if (bgmAudio) bgmAudio.pause()
}

// 播放音效
export const playSFX = (url) => {
  if (!sfxEnabled) return
  const audio = new Audio(url)
  audio.volume = 0.5
  audio.play().catch(() => {})
}

// 切换背景音乐
export const toggleBGM = () => {
  bgmEnabled = !bgmEnabled
  if (bgmEnabled && bgmAudio) bgmAudio.play().catch(() => {})
  else if (bgmAudio) bgmAudio.pause()
  return bgmEnabled
}

// 切换音效
export const toggleSFX = () => {
  sfxEnabled = !sfxEnabled
  return sfxEnabled
}

// 获取音乐状态
export const getAudioState = () => ({
  bgmEnabled,
  sfxEnabled
})

// 设置音量
export const setVolume = (type, volume) => {
  if (type === 'bgm' && bgmAudio) bgmAudio.volume = volume
  if (type === 'sfx' && sfxAudio) sfxAudio.volume = volume
}
