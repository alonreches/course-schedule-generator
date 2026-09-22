import type { CourseSchedule, Student } from './types'

const NIGHT_BG = '#12122a'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  return d.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
  })
}

export function generateHtml(schedule: CourseSchedule, students: Student[]): string {
  const studentMap = new Map(students.map(s => [s.id, s.name]))

  const weeksHtml = schedule.weeks.map(week => {
    const numCircuits = week.days[0]?.circuits.length ?? 0

    const headerCells = week.days[0]?.circuits.map(c =>
      `<th class="col-header">Circuit ${esc(c.circuitLabel)}</th>`
    ).join('') ?? ''

    const rowsHtml = week.days.map(day => {
      const dayCells = day.circuits.map(circuitDay => {
        const isNight = circuitDay.shift === 'night'
        const slotsHtml = circuitDay.slots.map((slot, i) => {
          const name = slot.studentOverride ?? studentMap.get(slot.studentId) ?? slot.studentId
          return `<li class="slot"><span class="slot-num">${i + 1}</span><span class="slot-student">${esc(name)}</span><span class="slot-item">${esc(slot.itemName)}</span></li>`
        }).join('')
        return `<td class="circuit-block${isNight ? ' night' : ''}" style="${isNight ? `background:${NIGHT_BG};` : ''}">
  <div class="circuit-meta">
    <span class="shift-badge">${circuitDay.shift === 'night' ? 'Night' : 'Day'}</span>
  </div>
  <ul class="slots">${slotsHtml}</ul>
  <div class="circuit-info">
    <div><strong>Instructor:</strong> ${esc(circuitDay.instructor ?? '—')}</div>
    <div><strong>Simulator:</strong> ${esc(circuitDay.simulator ?? '—')}</div>
    ${circuitDay.notes ? `<div class="notes">${esc(circuitDay.notes)}</div>` : ''}
  </div>
</td>`
      }).join('')

      return `<tr>
  <th class="day-header" scope="row">
    <span class="day-date">${formatDate(day.date)}</span>
    <span class="badge badge-${day.type}">${day.type === 'assessment' ? 'Assessment' : 'Run'}</span>
  </th>
  ${dayCells}
</tr>`
    }).join('')

    return `<section class="week-section">
  <h2>Week ${week.weekNumber}</h2>
  <table class="week-table" style="grid-template-columns: 140px repeat(${numCircuits}, 1fr)">
    <thead><tr><th></th>${headerCells}</tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</section>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Course Schedule</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:#1e1e1e;color:#d4d4d4;padding:24px}
h1{font-size:20px;margin-bottom:24px}
h2{font-size:16px;margin-bottom:12px;color:#9e9e9e}
.week-section{margin-bottom:40px}
.week-table{border-collapse:collapse;width:100%}
.week-table th,.week-table td{border:1px solid #3e3e3e;padding:8px;vertical-align:top}
.col-header{background:#252526;color:#9e9e9e;font-size:12px;text-align:center;font-weight:600}
.day-header{background:#252526;font-weight:normal;font-size:12px;white-space:nowrap;min-width:140px}
.day-date{display:block;font-weight:600;margin-bottom:4px}
.circuit-block{background:#2d2d2d;font-size:12px}
.circuit-block.night{background:${NIGHT_BG}}
.circuit-meta{display:flex;gap:6px;margin-bottom:6px;align-items:center}
.shift-badge{font-size:11px;background:#3e3e3e;padding:1px 5px;border-radius:3px}
.badge{font-size:11px;padding:1px 5px;border-radius:3px;font-weight:600}
.badge-run{background:#1e3a1e;color:#6dbf6d}
.badge-assessment{background:#3a1e1e;color:#c97070}
.slots{list-style:none;margin-bottom:8px}
.slot{display:flex;align-items:center;gap:6px;padding:2px 0;border-bottom:1px solid #3e3e3e}
.slot:last-child{border-bottom:none}
.slot-num{color:#6e6e6e;min-width:16px;text-align:right;font-size:11px}
.slot-student{flex:1;font-weight:500}
.slot-item{flex:1;color:#9e9e9e}
.circuit-info{font-size:11px;color:#9e9e9e;display:flex;flex-direction:column;gap:3px}
.notes{margin-top:4px;font-style:italic}
</style>
</head>
<body>
<h1>Course Schedule</h1>
${weeksHtml}
</body>
</html>`
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export interface BlankCellWarning {
  date: string
  circuitLabel: string
  missing: ('instructor' | 'simulator')[]
}

export function findBlankCells(schedule: CourseSchedule): BlankCellWarning[] {
  const warnings: BlankCellWarning[] = []
  for (const week of schedule.weeks) {
    for (const day of week.days) {
      for (const cd of day.circuits) {
        const missing: ('instructor' | 'simulator')[] = []
        if (!cd.instructor?.trim()) missing.push('instructor')
        if (!cd.simulator?.trim()) missing.push('simulator')
        if (missing.length > 0) {
          warnings.push({ date: day.date, circuitLabel: cd.circuitLabel, missing })
        }
      }
    }
  }
  return warnings
}
