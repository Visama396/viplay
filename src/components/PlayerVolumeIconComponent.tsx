import { usePlayerStore } from '@/store/playerStore'
import { Mute, VolumeLow, VolumeMid, VolumeHigh } from '@/icons/Volume'

const isVolumeSilenced = (noise: number) => noise == 0
const isVolumeLow = (noise: number) => noise > 0 && noise < 0.3
const isVolumeMid = (noise: number) => noise >= 0.3 && noise < 0.7
const isVolumeHigh = (noise: number) => noise >= 0.7

const getVolumeIconByNoise = (noise: number) => {
  return (
    <>
      {isVolumeSilenced(noise) && <Mute />}
      {isVolumeLow(noise) && <VolumeLow />}
      {isVolumeMid(noise) && <VolumeMid />}
      {isVolumeHigh(noise) && <VolumeHigh />}
    </>
  )
}

export const PlayerVolumeIconComponent = () => {
  const volume = usePlayerStore(state => state.volume)
  return getVolumeIconByNoise(volume)
}