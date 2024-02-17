import { usePlayerStore } from '@/store/playerStore'
import { useRef } from 'react'
import { Slider } from '@/components/Slider'
import { PlayerVolumeIconComponent } from '@/components/PlayerVolumeIconComponent'

export const VolumeControl = () => {
  const volume = usePlayerStore(state => state.volume)
  const setVolume = usePlayerStore(state => state.setVolume)
  const previousVolumeRef = useRef(volume)

  const isVolumeSilenced = volume == 0

  const handleClickVolume = () => {
    if (isVolumeSilenced) {
      setVolume(previousVolumeRef.current)
    } else {
      previousVolumeRef.current = volume
      setVolume(0)
    }
  }

  return (
    <div className="flex justify-center gap-x-2 text-white">
      <button className="opacity-70 hover:opacity-100 transition" onClick={handleClickVolume}>
        <PlayerVolumeIconComponent />
      </button>
      <Slider 
        defaultValue={[100]}
        max={100} 
        min={0}
        value={[volume * 100]} 
        className="w-[95px]" 
        onValueChange={(value) => {
          const [newVolume] = value
          const volumeValue = newVolume / 100
          setVolume(volumeValue)
        }}
      />
    </div>
  )
}