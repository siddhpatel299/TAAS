import { motion } from 'framer-motion';
import { Check, Monitor, Palette, Grid3X3 } from 'lucide-react';
import { useOSStore } from '@/stores/os.store';
import { useHUDSounds } from '@/hooks/useHUDSounds';

const WALLPAPERS = [
  {
    id: 'gradient-mesh',
    name: 'Mesh',
    preview: 'linear-gradient(135deg, #0f172a, #1e293b, #334155)',
    full: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    preview: 'linear-gradient(135deg, #0a0e1a, #1a1a4a, #0c2340)',
    full: 'linear-gradient(135deg, #0a0e1a 0%, #1a1a4a 40%, #0c2340 100%)',
  },
  {
    id: 'cyber',
    name: 'Cyber',
    preview: 'linear-gradient(135deg, #020810, #0a2030, #051520)',
    full: 'linear-gradient(135deg, #020810 0%, #0a2030 50%, #051520 100%)',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    preview: 'linear-gradient(135deg, #1a0a2e, #2d1b69, #44107a)',
    full: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b69 50%, #44107a 100%)',
  },
  {
    id: 'forest',
    name: 'Forest',
    preview: 'linear-gradient(135deg, #0a1f0a, #1a3a1a, #0f2a12)',
    full: 'linear-gradient(135deg, #0a1f0a 0%, #1a3a1a 50%, #0f2a12 100%)',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    preview: 'linear-gradient(135deg, #020215, #0a0a25, #050520)',
    full: 'linear-gradient(135deg, #020215 0%, #0a0a25 50%, #050520 100%)',
  },
  {
    id: 'ember',
    name: 'Ember',
    preview: 'linear-gradient(135deg, #1a0a00, #2d1500, #401a00)',
    full: 'linear-gradient(135deg, #1a0a00 0%, #2d1500 50%, #401a00 100%)',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    preview: 'linear-gradient(135deg, #001020, #002040, #001530)',
    full: 'linear-gradient(135deg, #001020 0%, #002040 50%, #001530 100%)',
  },
  {
    id: 'solid-black',
    name: 'Black',
    preview: '#000000',
    full: '#000000',
  },
  {
    id: 'solid-charcoal',
    name: 'Charcoal',
    preview: '#1a1a1a',
    full: '#1a1a1a',
  },
];

const ICON_SIZES = [
  { value: 'small' as const, label: 'Small' },
  { value: 'medium' as const, label: 'Medium' },
  { value: 'large' as const, label: 'Large' },
];

export function WallpaperSettings() {
  const { wallpaper, setWallpaper, desktopIconSize, osStyle, colorMode, setColorMode, setOSStyle } = useOSStore();
  const { play } = useHUDSounds();
  const isHUD = osStyle === 'hud';

  const sectionTitleStyle = {
    color: isHUD ? '#22d3ee' : '#94a3b8',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.15em',
    fontFamily: isHUD ? "'Rajdhani', sans-serif" : undefined,
  };

  const textStyle = {
    color: isHUD ? '#a5f3fc' : '#e2e8f0',
    fontSize: '12px',
  };

  const subtextStyle = {
    color: isHUD ? 'rgba(0,255,255,0.4)' : 'rgba(255,255,255,0.4)',
    fontSize: '10px',
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold tracking-wider uppercase flex items-center gap-2"
          style={{ color: isHUD ? '#e0f7fa' : '#fff', fontFamily: isHUD ? "'Rajdhani', sans-serif" : undefined }}>
          <Monitor className="w-5 h-5" style={{ color: isHUD ? '#22d3ee' : '#60a5fa' }} />
          Display Settings
        </h2>
        <p style={subtextStyle} className="mt-1">Personalize your workspace appearance</p>
      </div>

      {/* Wallpaper Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Palette className="w-3.5 h-3.5" style={{ color: isHUD ? '#0891b2' : '#64748b' }} />
          <span style={sectionTitleStyle}>WALLPAPER</span>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {WALLPAPERS.map((wp) => (
            <button
              key={wp.id}
              onClick={() => { play('click'); setWallpaper(wp.id); }}
              className="relative group aspect-video overflow-hidden border transition-all"
              style={{
                background: wp.preview,
                borderColor: wallpaper === wp.id
                  ? isHUD ? '#22d3ee' : '#60a5fa'
                  : isHUD ? 'rgba(0,255,255,0.15)' : 'rgba(255,255,255,0.08)',
                boxShadow: wallpaper === wp.id
                  ? `0 0 12px ${isHUD ? 'rgba(0,255,255,0.3)' : 'rgba(96,165,250,0.3)'}`
                  : undefined,
              }}
            >
              {wallpaper === wp.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.3)' }}
                >
                  <Check className="w-4 h-4" style={{ color: isHUD ? '#22d3ee' : '#60a5fa' }} />
                </motion.div>
              )}
              <div className="absolute bottom-0 left-0 right-0 py-0.5 text-center"
                style={{ background: 'rgba(0,0,0,0.5)' }}>
                <span className="text-[8px] tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {wp.name.toUpperCase()}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Icon Size Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Grid3X3 className="w-3.5 h-3.5" style={{ color: isHUD ? '#0891b2' : '#64748b' }} />
          <span style={sectionTitleStyle}>ICON SIZE</span>
        </div>
        <div className="flex gap-2">
          {ICON_SIZES.map((size) => (
            <button
              key={size.value}
              onClick={() => {
                play('click');
                useOSStore.setState({ desktopIconSize: size.value });
              }}
              className="px-4 py-2 border text-[11px] font-bold tracking-wider transition-all"
              style={{
                background: desktopIconSize === size.value
                  ? isHUD ? 'rgba(0,255,255,0.1)' : 'rgba(96,165,250,0.1)'
                  : 'transparent',
                borderColor: desktopIconSize === size.value
                  ? isHUD ? '#22d3ee' : '#60a5fa'
                  : isHUD ? 'rgba(0,255,255,0.15)' : 'rgba(255,255,255,0.08)',
                color: desktopIconSize === size.value
                  ? isHUD ? '#e0f7fa' : '#fff'
                  : isHUD ? 'rgba(0,255,255,0.5)' : 'rgba(255,255,255,0.5)',
              }}
            >
              {size.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Theme Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Monitor className="w-3.5 h-3.5" style={{ color: isHUD ? '#0891b2' : '#64748b' }} />
          <span style={sectionTitleStyle}>OS STYLE</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { play('click'); setOSStyle('normal'); }}
            className="flex-1 p-4 border transition-all"
            style={{
              background: osStyle === 'normal'
                ? isHUD ? 'rgba(0,255,255,0.08)' : 'rgba(96,165,250,0.08)'
                : 'transparent',
              borderColor: osStyle === 'normal'
                ? isHUD ? '#22d3ee' : '#60a5fa'
                : isHUD ? 'rgba(0,255,255,0.15)' : 'rgba(255,255,255,0.08)',
            }}
          >
            <div className="text-[11px] font-bold tracking-wider" style={textStyle}>STANDARD</div>
            <p className="text-[9px] mt-1" style={subtextStyle}>Clean, minimal desktop</p>
          </button>
          <button
            onClick={() => { play('click'); setOSStyle('hud'); }}
            className="flex-1 p-4 border transition-all"
            style={{
              background: osStyle === 'hud'
                ? 'rgba(0,255,255,0.08)'
                : isHUD ? 'rgba(0,255,255,0.02)' : 'transparent',
              borderColor: osStyle === 'hud'
                ? '#22d3ee'
                : isHUD ? 'rgba(0,255,255,0.15)' : 'rgba(255,255,255,0.08)',
            }}
          >
            <div className="text-[11px] font-bold tracking-wider" style={{ color: '#22d3ee' }}>HUD MODE</div>
            <p className="text-[9px] mt-1" style={subtextStyle}>Tactical defense interface</p>
          </button>
        </div>
      </div>

      {/* Color Mode (only for normal OS) */}
      {osStyle === 'normal' && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-3.5 h-3.5" style={{ color: '#64748b' }} />
            <span style={sectionTitleStyle}>COLOR MODE</span>
          </div>
          <div className="flex gap-2">
            {(['dark', 'light'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => { play('click'); setColorMode(mode); }}
                className="px-4 py-2 border text-[11px] font-bold tracking-wider transition-all"
                style={{
                  background: colorMode === mode ? 'rgba(96,165,250,0.1)' : 'transparent',
                  borderColor: colorMode === mode ? '#60a5fa' : 'rgba(255,255,255,0.08)',
                  color: colorMode === mode ? '#fff' : 'rgba(255,255,255,0.5)',
                }}
              >
                {mode.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
