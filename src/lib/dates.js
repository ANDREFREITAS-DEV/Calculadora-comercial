// dates.js — cálculos de datas (dias entre datas, somar dias, idade)

const MS_DAY = 24 * 60 * 60 * 1000;

function atMidnightUTC(dateStr) {
  // dateStr no formato yyyy-mm-dd (input type=date)
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Dias corridos entre duas datas (fim − início). */
export function daysBetween(startStr, endStr) {
  return Math.round((atMidnightUTC(endStr) - atMidnightUTC(startStr)) / MS_DAY);
}

/** Quebra a diferença entre duas datas em anos, meses e dias de calendário. */
export function calendarBreakdown(startStr, endStr) {
  let [sy, sm, sd] = startStr.split('-').map(Number);
  const [ey, em, ed] = endStr.split('-').map(Number);

  let years = ey - sy;
  let months = em - sm;
  let days = ed - sd;

  if (days < 0) {
    months -= 1;
    // dias do mês anterior ao mês final
    const prevMonthDays = new Date(Date.UTC(ey, em - 1, 0)).getUTCDate();
    days += prevMonthDays;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

/** Soma (ou subtrai) dias a uma data; retorna yyyy-mm-dd. */
export function addDays(dateStr, days) {
  const t = atMidnightUTC(dateStr) + days * MS_DAY;
  return new Date(t).toISOString().slice(0, 10);
}

/** Formata yyyy-mm-dd como dd/mm/yyyy. */
export function toBR(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

/** Data de hoje como yyyy-mm-dd (fuso local). */
export function todayISO() {
  const now = new Date();
  const off = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - off).toISOString().slice(0, 10);
}

/** Nome do dia da semana em pt-BR para yyyy-mm-dd. */
export function weekdayBR(dateStr) {
  const d = new Date(atMidnightUTC(dateStr));
  return d.toLocaleDateString('pt-BR', { weekday: 'long', timeZone: 'UTC' });
}
