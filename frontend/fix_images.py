import sys
path = 'd:/Web_Dev/hackathons/Aether_hackathon_2026/kisan-vikas/frontend/src/app/page.tsx'
text = open(path, encoding='utf-8').read()

text = text.replace('import Image from "next/image";', '')
text = text.replace('<Image', '<img')
text = text.replace('fill', '')
text = text.replace('sizes="100vw"', '')
text = text.replace('sizes="(max-width: 1024px) 100vw, 50vw"', '')
text = text.replace('priority={index === 0}', '')
text = text.replace('className={`object-cover transition-all duration-[7000ms] ease-out', 'className={`absolute inset-0 w-full h-full object-cover transition-all duration-[7000ms] ease-out')
text = text.replace('className="object-cover group-hover:scale-108 transition-transform duration-700 ease-out"', 'className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"')

# Also remove trailing self-closing slash if any because img is void element, but it's fine in JSX
open(path, 'w', encoding='utf-8').write(text)
