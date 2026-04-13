import { useState, useEffect, useRef } from 'react';

const POKEMONS = [
  { name: 'Pikachu', id: 25 },
  { name: 'Charmander', id: 4 },
  { name: 'Squirtle', id: 7 },
  { name: 'Bulbasaur', id: 1 },
  { name: 'Eevee', id: 133 },
];

export default function Pokemon() {
  const [pokemon, setPokemon] = useState(POKEMONS[0]);
  const [isReacting, setIsReacting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Movement state
  const posRef = useRef(0);
  const dirRef = useRef(1);
  const stateRef = useRef<'walk' | 'idle'>('walk');
  const nextStateTimeRef = useRef(0);
  const speedRef = useRef(1);

  useEffect(() => {
    // Pick a random pokemon on mount
    setPokemon(POKEMONS[Math.floor(Math.random() * POKEMONS.length)]);
    // Start at a random position
    posRef.current = Math.random() * (window.innerWidth - 100);
    // Initialize state timer
    nextStateTimeRef.current = performance.now() + 1000;
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    const animate = (time: number) => {
      if (!isReacting && containerRef.current && imgRef.current) {
        
        // State Machine: Switch between walking and idling naturally
        if (time > nextStateTimeRef.current) {
          if (stateRef.current === 'walk') {
            // Switch to idle
            stateRef.current = 'idle';
            nextStateTimeRef.current = time + 3000 + Math.random() * 4000; // Idle for 3-7 seconds
            
            // 30% chance to look the other way while idling
            if (Math.random() > 0.7) {
              dirRef.current *= -1;
            }
          } else {
            // Switch to walk
            stateRef.current = 'walk';
            nextStateTimeRef.current = time + 4000 + Math.random() * 5000; // Walk for 4-9 seconds
            speedRef.current = 0.2 + Math.random() * 0.4; // Random speed between 0.2 and 0.6 (slower)
            
            // 40% chance to change direction when starting to walk
            if (Math.random() > 0.6) {
              dirRef.current *= -1;
            }
          }
        }

        // Apply movement if walking
        if (stateRef.current === 'walk') {
          posRef.current += speedRef.current * dirRef.current;
          
          // Soft bounds checking (turn around if hitting edges)
          if (posRef.current >= window.innerWidth - 80) {
            dirRef.current = -1;
            posRef.current = window.innerWidth - 80;
          } else if (posRef.current <= 0) {
            dirRef.current = 1;
            posRef.current = 0;
          }

          // Add a slight bobbing effect while walking
          const bob = Math.sin(time * 0.005) * 1.5; // Slower, more subtle bob (1.5px)
          containerRef.current.style.transform = `translate(${posRef.current}px, ${bob}px)`;
        } else {
          // Reset bobbing when idle
          containerRef.current.style.transform = `translate(${posRef.current}px, 0px)`;
        }

        // Flip image based on direction (sprites face left by default)
        imgRef.current.style.transform = `scaleX(${dirRef.current === 1 ? -1 : 1})`;
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isReacting]);

  const handleClick = () => {
    if (isReacting) return;
    setIsReacting(true);
    
    // Make them face the user/screen (scaleX 1 or -1 doesn't matter, but we can stop them)
    stateRef.current = 'idle';
    nextStateTimeRef.current = performance.now() + 2000; // stay idle after reacting
    
    // Reset reaction after animation finishes
    setTimeout(() => setIsReacting(false), 1000);
  };

  // Using PokeAPI's Generation V animated sprites
  const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokemon.id}.gif`;

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className="pokemon-container"
    >
      <div className={`pokemon-jump-wrapper ${isReacting ? 'reacting' : ''}`}>
        <img 
          ref={imgRef}
          src={spriteUrl} 
          alt={pokemon.name} 
          className="pokemon-sprite"
        />
      </div>
      {isReacting && <div className="pokemon-heart">❤️</div>}
    </div>
  );
}