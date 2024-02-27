import { usePlayerStore } from '../store/playerStore'
import { Pause, Play, Prev, Next, Loop, NoLoop } from '@/icons/PlayerIcons'
import { Slider } from '@/components/Slider'
import { Mute, VolumeLow, VolumeMid, VolumeHigh } from '@/icons/Volume'

import { useEffect, useRef, useState } from "react"

const CurrentSong = ({ image, title, artists }) => {
  return (
    <div className="flex items-center gap-5 relative overflow-hidden">
      {image && 
        (
          <picture className="size-16 bg-zinc-800 rounded-md shadow-lg overflow-hidden">
            <img src={image} alt={title} />
          </picture>
      )}

      <div className="flex flex-col">
        <h3 className="font-semibold text-sm block">{title}</h3>
        <span className="text-xs opacity-80">
          {artists?.join(', ')}
        </span>
      </div>
    </div>
  )
}

const PlayerControl = ({ audio }) => {
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    audio.current.addEventListener('timeupdate', handleTimeUpdate)

    return () => {
      audio.current.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [])

  const handleTimeUpdate = () => {
    setCurrentTime(audio.current.currentTime)
  }

  const formatTime = time => {
    if (time == null) return '0:00'
    
    const seconds = Math.floor(time % 60)
    const minutes = Math.floor(time / 60)

    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const duration = audio?.current?.duration ?? 0

  return (
    <div className="flex gap-x-3 text-xs pt-2">
      <span className="opacity-50 w-12 text-right">{formatTime(currentTime)}</span>

      <Slider
        max={audio?.current?.duration ?? 0}
        min={0}
        value={[currentTime]}
        className="w-[400px]"
        onValueChange={(value) => {
          const [newCurrentTime] = value
          audio.current.currentTime = newCurrentTime
        }}
      />
      
      <span className="opacity-50 w-12">{duration ? formatTime(duration) : '0:00'}</span>

    </div>
  )
}

const VolumeControl = () => {
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
        {isVolumeSilenced? (<Mute />) 
          : (volume > 0 && volume < 0.3)? (<VolumeLow />)
          : (volume >= 0.3 && volume < 0.7)? (<VolumeMid />)
          : (<VolumeHigh />)}
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

export function Player () {
  const { currentMusic, setCurrentMusic, isPlaying, setIsPlaying, volume, isOnRepeat, setIsOnRepeat } = usePlayerStore(state => state)
  const audioRef = useRef()

  useEffect(() => {
    if (!currentMusic.song) return

    isPlaying 
      ? audioRef.current.play().catch(e => console.error('error playing: ', e)) 
      : audioRef.current.pause()
  }, [isPlaying])

  useEffect(() => {
    audioRef.current.volume = volume
  }, [volume])

  useEffect(() => {
    const { song, playlist } = currentMusic 
    if (song) {
      const songId = song.id.toString().padStart(2, '0')
      audioRef.current.src = `/music/${playlist?.id}/${songId}.mp3`
      audioRef.current.volume = volume
      audioRef.current.play()
    }
  }, [currentMusic])

  const getSongIndex = (id) => {
    return currentMusic.songs.findIndex(e => e.id === id) ?? -1
  }

  const onNextSong = () => {
    const { song, playlist, songs } = currentMusic
    const index = getSongIndex(song.id)

    if (index > -1 && index + 1 < songs.length) {
      setIsPlaying(false)
      setCurrentMusic({ songs, playlist, song: songs[index + 1] })
      setIsPlaying(true)
    }
  }

  const onPrevSong = () => {
    const { song, playlist, songs } = currentMusic
    const index = getSongIndex(song.id)

    if (index > -1 && index > 0) {
      setIsPlaying(false)
      setCurrentMusic({ songs, playlist, song: songs[index - 1] })
      setIsPlaying(true)
    }
  }

  const onRepeat = () => {
    const { song, playlist, songs } = currentMusic
    const index = getSongIndex(song.id)

    setIsPlaying(false)
    setCurrentMusic({ songs, playlist, song: songs[index] })
    setIsPlaying(true)
  }

  const handleClick = () => {
    setIsPlaying(!isPlaying)
  }

  const handleOnEnded = () => {
    if (isOnRepeat) onRepeat()
    else onNextSong()
  }

  const handleRepeatSong = () => {
    setIsOnRepeat(!isOnRepeat)
  }

  return (
    <div className="flex flex-row justify-between w-full px-1 z-50">
      <div className="w-[200px]">
        <CurrentSong {...currentMusic.song} />
      </div>

      <div className="grid place-content-center gap-4 flex-1">
        <div className="flex flex-col items-center justify-center">
          <div className="flex gap-8">
            <button title="Prev" onClick={onPrevSong}>
              <Prev />
            </button>
            <button 
              title="Play / Pause"
              className="bg-white rounded-full p-2" 
              onClick={handleClick}
            >
              {isPlaying ? <Pause /> : <Play />}
            </button>
            <button onClick={onNextSong} title="Next">
              <Next />
            </button>
            <button onClick={handleRepeatSong} title="Loop">
              { (isOnRepeat)? <Loop /> : <NoLoop /> }
            </button>
          </div>
          <PlayerControl audio={audioRef} />
          <audio ref={audioRef} onEnded={handleOnEnded} />
        </div>
      </div>

      <div className="grid place-content-center">
        <VolumeControl />
      </div>
    </div>
  )
}