const sheetURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTlWtHz4SOh9DhSrhlJkPhT1ws47HJJHU6pnLnTFfJOB01B7PAqStxhmCG-35sgEA/pub?gid=952927519&single=true&output=csv";

async function loadData() {
  const response = await fetch(sheetURL);
  const csvText = await response.text();

  const rows = csvText.split("\n").map((row) => row.split(","));

  const headers = rows[0];
  const data = rows.slice(1);

  const table = document.getElementById("games-table");

  let html = "<tr>";

  headers.forEach((header) => {
    html += `<th>${header}</th>`;
  });

  html += "</tr>";

  data.forEach((row) => {
    html += "<tr>";

    row.forEach((cell) => {
      html += `<td>${cell}</td>`;
    });

    html += "</tr>";
  });

  table.innerHTML = html;
}

loadData();
