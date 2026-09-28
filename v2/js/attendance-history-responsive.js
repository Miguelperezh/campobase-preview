// Corrección visual del historial de Asistencia.
// Mantiene cada tabla dentro de la ficha del jugador sin tocar datos ni lógica.

const STYLE_ID = 'attendance-history-responsive-style';

export function installAttendanceHistoryResponsiveStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .attendance-grid {
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
      align-items: start;
    }

    .attendance-player {
      min-width: 0;
      max-width: 100%;
      overflow: hidden;
      align-self: start;
      height: max-content;
    }

    .attendance-player details {
      min-width: 0;
      max-width: 100%;
      overflow: hidden;
    }

    .attendance-player .minute-table {
      width: 100%;
      max-width: 100%;
      table-layout: fixed;
    }

    .attendance-player .minute-table th,
    .attendance-player .minute-table td {
      min-width: 0;
      padding: .5rem .35rem;
      text-align: left;
      vertical-align: top;
      white-space: normal;
      overflow-wrap: anywhere;
      word-break: normal;
    }

    .attendance-player .minute-table th:nth-child(1),
    .attendance-player .minute-table td:nth-child(1) {
      width: 30%;
    }

    .attendance-player .minute-table th:nth-child(2),
    .attendance-player .minute-table td:nth-child(2) {
      width: 31%;
    }

    .attendance-player .minute-table th:nth-child(3),
    .attendance-player .minute-table td:nth-child(3) {
      width: 39%;
    }

    .attendance-player .minute-table th:last-child,
    .attendance-player .minute-table td:last-child {
      text-align: left;
    }

    @media (max-width: 650px) {
      .attendance-player .minute-table {
        font-size: .76rem;
      }

      .attendance-player .minute-table th,
      .attendance-player .minute-table td {
        padding: .45rem .28rem;
      }
    }
  `;
  document.head.append(style);
}

installAttendanceHistoryResponsiveStyles();
