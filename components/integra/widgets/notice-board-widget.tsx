"use client"

import type { Notice } from "@/lib/integra-state"

interface NoticeBoardWidgetProps {
  iconColor: string
  notices: Notice[]
  onNoticeClick: (notice: Notice) => void
  onManageClick?: () => void
  canManage?: boolean
}

export function NoticeBoardWidget({
  iconColor,
  notices,
  onNoticeClick,
  onManageClick,
  canManage,
}: NoticeBoardWidgetProps) {
  const pinnedNotices = notices.filter((n) => n.pinned).slice(0, 4)

  return (
    <div className="widget-container p-0 h-full min-h-0 flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border/30 flex-shrink-0">
        <div className="flex items-center gap-2">
          <i className={`fas fa-thumbtack text-sm ${iconColor}`} />
          <span className="font-semibold text-sm">Notice Board</span>
        </div>
        {canManage && onManageClick && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onManageClick()
            }}
            className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition"
            title="Manage notices"
          >
            <i className="fas fa-cog text-sm" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 p-3 bg-background/80 grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto">

        {pinnedNotices.length === 0 ? (
          <div className="col-span-2 flex flex-col items-center justify-center text-sm text-muted-foreground py-4">
            <i className="fas fa-thumbtack text-xl mb-1 opacity-40" />
            No pinned notices
          </div>
        ) : (
          pinnedNotices.map((notice) => (
            <div
              key={notice.id}
              onClick={() => onNoticeClick(notice)}
              className="cursor-pointer bg-white/85 backdrop-blur-sm border border-border/40 rounded-lg px-3 py-2 shadow-sm hover:shadow-md transition-all hover:border-border"
            >
              <p className="text-xs font-medium text-foreground leading-tight line-clamp-2">
                {notice.title}
              </p>
            </div>
          ))
        )}

      </div>
    </div>
  )
}
