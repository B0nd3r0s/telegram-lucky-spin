
type SoundType = 'openCase' | 'win' | 'lose' | 'upgrade' | 'downgrade' | 'click';

class SoundManager {
  private sounds: Map<SoundType, HTMLAudioElement>;
  private isMuted: boolean = false;

  constructor() {
    this.sounds = new Map();
    
    // Initialize sounds
    this.initializeSounds();
    
    // Try to restore mute preference from localStorage
    this.isMuted = localStorage.getItem('soundMuted') === 'true';
  }

  private initializeSounds() {
    // Define all sounds used in the app
    const soundFiles: Record<SoundType, string> = {
      openCase: '/sounds/open-case.mp3',
      win: '/sounds/win.mp3',
      lose: '/sounds/lose.mp3',
      upgrade: '/sounds/upgrade.mp3',
      downgrade: '/sounds/downgrade.mp3',
      click: '/sounds/click.mp3',
    };

    // Create audio elements for each sound
    Object.entries(soundFiles).forEach(([key, path]) => {
      const audio = new Audio(path);
      audio.preload = 'auto';
      this.sounds.set(key as SoundType, audio);
    });
  }

  /**
   * Play a sound effect
   * @param type The type of sound to play
   * @param volume Optional volume level (0-1)
   */
  play(type: SoundType, volume: number = 1.0): void {
    if (this.isMuted) return;
    
    const sound = this.sounds.get(type);
    if (sound) {
      sound.currentTime = 0;
      sound.volume = volume;
      sound.play().catch(err => {
        console.error('Failed to play sound:', err);
      });
    }
  }

  /**
   * Toggle sound on/off
   * @returns New mute state
   */
  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('soundMuted', this.isMuted.toString());
    return this.isMuted;
  }

  /**
   * Set mute state explicitly
   * @param mute Whether to mute or unmute
   */
  setMute(mute: boolean): void {
    this.isMuted = mute;
    localStorage.setItem('soundMuted', this.isMuted.toString());
  }

  /**
   * Get current mute state
   */
  getMuteState(): boolean {
    return this.isMuted;
  }
}

// Create a singleton instance
const soundManager = new SoundManager();
export default soundManager;
