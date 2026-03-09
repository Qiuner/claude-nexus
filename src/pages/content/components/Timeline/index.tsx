/**
 * Renders a fixed-position timeline navigator for claude.ai messages.
 */

import { useTimeline } from '../../hooks/useTimeline';

export default function Timeline() {
  const { nodes, activeIndex, scrollToNode } = useTimeline();

  if (nodes.length === 0) return null;

  return (
    <div className="fixed right-3 top-[10vh] bottom-[10vh] z-50 w-[2.5rem] overflow-visible">
      <div
        className={`flex h-full w-full flex-col items-center ${
          nodes.length === 1 ? 'justify-center' : ''
        }`}
      >
        {nodes.map((n, i) => {
          const isActive = i === activeIndex; 
          const sizeRem = isActive ? 1 : 0.625;
          const backgroundColor = '#d4a27a';
          const activeBackgroundColor = '#c96442';
          const glowColor = 'rgba(201, 100, 66, 0.3)';
          const isLast = i === nodes.length - 1;
          const tooltipText = n.text;

          return (
            <div key={n.id} className={`flex w-full flex-col items-center ${isLast ? '' : 'flex-1'}`}>
              <div className="group relative flex items-center justify-center">
                <button
                  type="button"
                  className="transition-all duration-150"
                  style={{
                    width: `${sizeRem}rem`,
                    height: `${sizeRem}rem`,
                    borderRadius: '50%',
                    backgroundColor: isActive ? activeBackgroundColor : backgroundColor,
                    border: 'none',
                    padding: 0,
                    boxShadow: isActive ? `0 0 0 0.1875rem ${glowColor}` : 'none',
                  }}
                  aria-label={`Timeline node ${i + 1}`}
                  onClick={() => scrollToNode(i)}
                />

                {tooltipText ? (
                  <div className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 translate-x-1 opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100">
                    <div className="relative w-[18rem] rounded-[0.75rem] border border-[#e5e0d8] bg-white px-[0.75rem] py-[0.4rem] text-[0.75rem] leading-4 text-[#374151] shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
                      <div
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          whiteSpace: 'normal',
                        }}
                      >
                        {tooltipText}
                      </div>
                      <div className="absolute left-full top-1/2 -translate-y-1/2">
                        <div className="h-0 w-0 border-y-[6px] border-y-transparent border-l-[6px] border-l-[#e5e0d8]" />
                        <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 h-0 w-0 border-y-[5px] border-y-transparent border-l-[5px] border-l-white" />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
              {isLast ? null : <div className="w-[1.5px] flex-1 bg-[#d1d5db]" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
