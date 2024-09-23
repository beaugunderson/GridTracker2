var GT = {};

importScripts("protos.js");
importScripts("gtCommon.js");

GT.workerFunctions =
{
  process: processQSOs
};

onmessage = (event) =>
{
  if ("type" in event.data)
  {
    if (event.data.type in GT.workerFunctions)
    {
      GT.workerFunctions[event.data.type](event.data);
    }
    else console.log("trackerWorker: unknown event type : " + event.data.type);
  }
  else console.log("trackerWorker: no event type");
};

function processQSOs(task)
{
  initQSOdata();
  var currentYear = new Date().getFullYear();
  for (let hash in task.QSOhash)
  {
    trackQSO(task.QSOhash[hash], currentYear);
  }
  var task = {};
  task.type = "processed";
  task.tracker = GT.tracker;
  postMessage(task);
}
