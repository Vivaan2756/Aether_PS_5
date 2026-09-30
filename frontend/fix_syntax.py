import sys
import shutil

src = 'd:/Web_Dev/hackathons/Aether_hackathon_2026/kisan-vikas/Aether_PS_5/src/app/page.tsx'
dest = 'd:/Web_Dev/hackathons/Aether_hackathon_2026/kisan-vikas/frontend/src/app/page.tsx'

shutil.copyfile(src, dest)
text = open(dest, encoding='utf-8').read()

# 1. Update routing
text = text.replace('setDemoModalOpen(true)', 'window.location.href = \'/dashboard\'')

# 2. Update Image components to standard img tags correctly
text = text.replace('import Image from "next/image";', '')
text = text.replace('<Image', '<img')
text = text.replace(' fill\n', '\n')
text = text.replace(' sizes="100vw"', '')
text = text.replace(' sizes="(max-width: 1024px) 100vw, 50vw"', '')
text = text.replace(' priority={index === 0}', '')
text = text.replace('className={`object-cover transition-all duration-[7000ms] ease-out', 'className={`absolute inset-0 w-full h-full object-cover transition-all duration-[7000ms] ease-out')
text = text.replace('className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"', 'className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"')

# 3. Update styling (Navbar, Sandbox, Pillars)
text = text.replace('bg-white/95 backdrop-blur-md border-b border-slate-200', 'bg-white/80 backdrop-blur-xl border-b border-emerald-100/50 shadow-[0_4px_30px_rgba(0,0,0,0.03)]')
text = text.replace('agri-grid-green', 'bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 shadow-inner')
text = text.replace('shadow-2xl relative overflow-hidden group hover:shadow-[0_25px_55px_rgba(0,0,0,0.18)]', 'shadow-[0_20px_60px_rgba(0,0,0,0.3)] relative overflow-hidden group hover:shadow-[0_25px_65px_rgba(0,0,0,0.35)]')
text = text.replace('bg-[#7ac15c] border-b border-[#68ab4b]', 'bg-emerald-50/50 border-b border-emerald-100')

# 4. Cinematic Overlay
text = text.replace('priority={index === 0}\n              />\n            </div>', '/>\n              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20" />\n            </div>')

# 5. Unsplash image URLs
replacements = {
    '/images/farm_workers_field.jpg': 'https://images.unsplash.com/photo-1592982537447-6f2334cb084b?q=80&w=2070&auto=format&fit=crop',
    '/images/tractor_spraying_field.jpg': 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?q=80&w=2071&auto=format&fit=crop',
    '/images/satellite_farm_ai.jpg': 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?q=80&w=2096&auto=format&fit=crop',
    '/images/soil_weather_intelligence.jpg': 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=2070&auto=format&fit=crop',
    '/images/pest_detection_ai.jpg': 'https://images.unsplash.com/photo-1530836369250-ef71a3a5e12d?q=80&w=2080&auto=format&fit=crop'
}
for old, new in replacements.items():
    text = text.replace(old, new)

open(dest, 'w', encoding='utf-8').write(text)
