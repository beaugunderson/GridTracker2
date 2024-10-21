function rosterColumnList(settings = {}, overrides = {})
{
  return CR.rosterSettings.columnOrder.filter(column =>
  {
    return column && (settings[column] || overrides[column]) && !(overrides[column] == false);
  });
}

function dragStart(event)
{
  event.dataTransfer.setData("Column", event.target.attributes.name.nodeValue);
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.dropEffect = "move";
}

function onDrop(event)
{
  event.preventDefault();

  if (event.target.draggable && event.target.nodeName == "TH")
  {
    let dragName = event.dataTransfer.getData("Column");
    let columns = rosterColumnList(CR.rosterSettings.columns, { Callsign: true });
    const movingColumn = columns.indexOf(dragName);
    const targetColumn = columns.indexOf(event.target.attributes.name.nodeValue);
  
    if (movingColumn < targetColumn)
    {
      columns.splice(targetColumn + 1, 0 ,dragName);
      columns.splice(movingColumn, 1);
    }
    else
    {
      columns.splice(movingColumn, 1);
      columns.splice(targetColumn, 0 , dragName);
    }

    changeRosterColumnOrder(columns);
  }
}

document.addEventListener("drop", onDrop);
document.addEventListener("dragover", function(event) {
  if (event.target.draggable && event.target.nodeName == "TH")
  {
    event.preventDefault();
  }
});

function renderHeaderForColumn(column)
{
  const columnInfo = ROSTER_COLUMNS[column];

  let attrs = (columnInfo && columnInfo.tableHeader && columnInfo.tableHeader()) || {};

  if (column != "Callsign")
  {
    attrs.draggable = "true";
    attrs.ondragstart ="dragStart(event)";
  }

  attrs.name = column;
  attrs.html = attrs.html || column;

  if (columnInfo.compare)
  {
    attrs.style = "cursor: pointer";
    attrs.onClick = `setRosterSorting('${column}');`;
  }

  if (CR.rosterSettings.sortColumn == column)
  {
    attrs.html += "<div style='display:inline-block;margin:0px;padding:0px;'>&nbsp;" + (CR.rosterSettings.sortReverse == false ? "▲" : "▼") + "</div>";
  }

  return renderRosterTableHTML("th", attrs);
}

function renderEntryForColumn(column, entry, element = "td")
{
  const columnInfo = ROSTER_COLUMNS[column];

  let attrs = (columnInfo && columnInfo.tableData && columnInfo.tableData(entry)) || {};

  return renderRosterTableHTML(element, attrs);
}

function renderRosterTableHTML(tag, attrs)
{
  let innerHtml = attrs.html || "";
  delete attrs.html;

  let rawAttrs = attrs.rawAttrs || "";
  delete attrs.rawAttrs;

  let attrEntries = Object.entries(attrs).filter(kv => !!kv[1]);

  return `<${tag} ${rawAttrs} ${attrEntries.map((kv) => `${kv[0]}="${kv[1].replace(/"/g, "&quot;")}"`).join(" ")}>${innerHtml}</${tag}>`
}

function setRosterSorting(column)
{
  if (CR.rosterSettings.sortColumn == column)
  {
    CR.rosterSettings.sortReverse = !CR.rosterSettings.sortReverse;
  }
  else
  {
    CR.rosterSettings.sortColumn = column;
    CR.rosterSettings.sortReverse = false;
  }

  viewRoster();
}

function sortCallList(callList, sortColumn, sortReverse, columns)
{
  const columnInfo = ROSTER_COLUMNS[sortColumn];

  const comparerList = [
    (columnInfo && columnInfo.compare) || ROSTER_COLUMNS.Age.compare,
    columns && columns.includes("Spot") && ROSTER_COLUMNS.Spot.compare,
    columns && columns.includes("dB") && ROSTER_COLUMNS.dB.compare,
    columns && columns.includes("Age") && ROSTER_COLUMNS.Age.compare,
    columns && columns.includes("Life") && ROSTER_COLUMNS.Life.compare,
    columns && columns.includes("Callsign") && ROSTER_COLUMNS.Callsign.compare
  ];

  callList.sort(multiColumnComparer(comparerList));

  if (sortReverse)
  {
    callList.reverse();
  }
}

const multiColumnComparer = (comparers) => (a, b) =>
{
  let result = 0;
  for (let i in comparers)
  {
    result = comparers[i] && comparers[i](a, b);
    if (result) return result;
  }
  return 0;
}

function validateRosterColumnOrder(columns)
{
  let correctedColumnOrder = (columns || DEFAULT_COLUMN_ORDER || []).slice();

  // Append columns not included in the suggested list.
  DEFAULT_COLUMN_ORDER.forEach(column =>
  {
    if (!correctedColumnOrder.includes(column)) correctedColumnOrder.push(column);
  })

  // Exclude any unexpected values
  correctedColumnOrder = correctedColumnOrder.filter(column => !!ROSTER_COLUMNS[column])

  // Ensure the first column is always Callsign
  correctedColumnOrder = correctedColumnOrder.filter(column => column != "Callsign");
  correctedColumnOrder.unshift("Callsign");

  return correctedColumnOrder;
}

function changeRosterColumnOrder(columns)
{
  CR.rosterSettings.columnOrder = validateRosterColumnOrder(columns);
  viewRoster();
}

function toggleColumn(target, column = null)
{
  let label = column || target.label;
  CR.rosterSettings.columns[label] = target.checked;
  CR.columnMembers[label].checked = target.checked;
  if (label == "Spot")
  {
    window.opener.setRosterSpot(CR.rosterSettings.columns.Spot);
  }

  viewRoster();
  resize();
}
