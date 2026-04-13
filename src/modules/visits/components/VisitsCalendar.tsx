import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import esLocale from "@fullcalendar/core/locales/es"
import type { Visit, VisitStatus } from "../types/visit"

interface VisitsCalendarProps {
  visits: Visit[]
  onView: (id: string) => void
}

const statusColors: Record<VisitStatus, string> = {
  scheduled: "#2563eb",
  in_progress: "#d97706",
  completed: "#16a34a",
  canceled: "#dc2626",
}

const statusLabel: Record<VisitStatus, string> = {
  scheduled: "Programada",
  in_progress: "En progreso",
  completed: "Completada",
  canceled: "Cancelada",
}

const VisitsCalendar = ({ visits, onView }: VisitsCalendarProps) => {
  const events = visits.map((visit) => ({
    id: visit.id,
    title: `${visit.clientName} - ${visit.technicianName || "Sin asignar"}`,
    start: `${visit.scheduledDate}T${visit.scheduledTime}`,
    allDay: false,
    backgroundColor: statusColors[visit.status],
    borderColor: statusColors[visit.status],
    extendedProps: {
      status: visit.status,
      type: visit.type,
      zone: visit.zone,
    },
  }))

  return (
    <div className="visits-calendar grid gap-4">
      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          timeZone="America/Bogota"
          firstDay={1}
          nowIndicator
          dayMaxEventRows={true}
          eventTimeFormat={{ hour: "2-digit", minute: "2-digit", meridiem: false }}
          slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          dayHeaderFormat={{ weekday: "short", day: "numeric", month: "numeric" }}
          locale={esLocale}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          buttonText={{
            today: "Hoy",
            month: "Mes",
            week: "Semana",
            day: "Dia",
          }}
          events={events}
          eventClassNames={(arg) => ["visit-event", `visit-event--${arg.event.extendedProps.status as VisitStatus}`]}
          eventClick={(info) => {
            info.jsEvent.preventDefault()
            onView(info.event.id)
          }}
          height="auto"
        />
      </section>

      <section className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {Object.entries(statusColors).map(([status, color]) => (
          <span key={status} className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            {statusLabel[status as VisitStatus]}
          </span>
        ))}
      </section>
    </div>
  )
}

export default VisitsCalendar
