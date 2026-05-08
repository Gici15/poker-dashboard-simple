const sheetURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTlWtHz4SOh9DhSrhlJkPhT1ws47HJJHU6pnLnTFfJOB01B7PAqStxhmCG-35sgEA/pub?gid=952927519&single=true&output=csv";

async function loadData() {
  const response = await fetch(sheetURL);
  const csvText = await response.text();

  const rows = csvText
    .trim()
    .split("\n")
    .map(row => row.split(","));

  const headers = rows[0];
  const data = rows.slice(1);

  const app = document.getElementById("app");

  let html = `
    <h1>Poker Nights Dashboard</h1>
    <p>Live data from Google Sheets</p>
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
  `;

  headers.forEach(header => {
    html += `<th>${header}</th>`;
  });

  html += `
          </tr>
        </thead>
        <tbody>
  `;

  data.forEach(row => {
    html += "<tr>";
    row.forEach(cell => {
      html += `<td>${cell}</td>`;
    });
    html += "</tr>";
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  app.innerHTML = html;
}

loadData();

