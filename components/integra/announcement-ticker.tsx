"use client"

interface AnnouncementTickerProps {
  announcements: string[]
  onEdit: () => void
  canManage: boolean
  headerColor?: string  // ADD THIS
}

export function AnnouncementTicker({ announcements, onEdit, canManage, headerColor }: AnnouncementTickerProps) {
  const content = announcements.map((text, i) => (
    <span key={i} className="px-8">
      {text}
    </span>
  ))

  return (
    <div 
      className="flex items-center text-white text-xl flex-shrink-0"
      style={{ backgroundColor: headerColor || '#0891b2' }}  // USE headerColor HERE
    >
      <div className="flex-grow overflow-hidden whitespace-nowrap cursor-pointer group">
        <div className="animate-marquee inline-block py-3 group-hover:[animation-play-state:paused]">
          {content}
          {content}
        </div>
      </div>
      {canManage && (
        <button 
          onClick={onEdit} 
          className="px-4 py-3 hover:opacity-80" 
          title="Edit Announcements"
        >
          <i className="fas fa-bullhorn text-xl"></i>
        </button>
      )}
    </div>
  )
}