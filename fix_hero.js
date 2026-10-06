const fs = require('fs');

let file = 'frontend/src/components/landing/LandingHero.tsx';
let content = fs.readFileSync(file, 'utf8');

// The right side of the hero starts with {/* Right: Product UI Preview */}
let rightSideRegex = /\{\/\* Right: Product UI Preview \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/section>/;

let replacement = `
            {/* Right: Integrated Hero Visual */}
            <div className="relative w-full h-full min-h-[400px] lg:min-h-[600px] flex items-center justify-center">
              {/* Decorative background glow matching the premium enterprise aesthetic */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 rounded-[3rem] blur-3xl" />
              
              <div className="relative w-full max-w-lg aspect-square">
                {/* Outer gradient mask to blend edges naturally into the #0F172A / #0B1121 background */}
                <div className="absolute inset-0 z-10 pointer-events-none" style={{ background: 'radial-gradient(circle, transparent 40%, #0F172A 70%)' }}></div>
                <div className="absolute inset-0 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, #0F172A 0%, transparent 20%, transparent 80%, #0F172A 100%)' }}></div>
                <div className="absolute inset-0 z-10 pointer-events-none" style={{ background: 'linear-gradient(to bottom, #0F172A 0%, transparent 20%, transparent 80%, #0F172A 100%)' }}></div>

                <img 
                  src="/images/hero-visual.jpg" 
                  alt="Autonomous AI Company Operations" 
                  className="absolute inset-0 w-full h-full object-cover rounded-full mix-blend-screen opacity-90"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
`;

if (content.match(rightSideRegex)) {
  content = content.replace(rightSideRegex, replacement);
  fs.writeFileSync(file, content);
  console.log('Updated LandingHero.tsx');
} else {
  console.log('Regex did not match LandingHero.tsx');
}
